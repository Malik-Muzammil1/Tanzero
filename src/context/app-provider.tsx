"use client";

import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Customer, Transaction, Currency, SortKey, Payment } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  writeBatch,
  arrayUnion,
  arrayRemove,
  setDoc,
} from 'firebase/firestore';
import { useAuth } from './auth-provider';
import { logActivity } from '@/lib/utils';

export interface AppContextType {
  customers: Customer[];
  addCustomer: (name: string, phoneNumber?: string) => Promise<void>;
  updateCustomer: (id: string, name: string, phoneNumber?: string) => Promise<void>;
  softDeleteCustomer: (id: string) => Promise<void>;
  addTransaction: (customerId: string, transaction: Omit<Transaction, 'id' | 'date' | 'status' | 'payments'>) => Promise<void>;
  updateTransaction: (customerId: string, transaction: Transaction) => Promise<void>;
  deleteTransaction: (customerId: string, transactionId: string) => Promise<void>;
  toggleTransactionStatus: (customerId: string, transactionId: string) => Promise<void>;
  addPayment: (customerId: string, transactionId: string, amount: number) => Promise<void>;
  deletePayment: (customerId: string, transactionId: string, paymentId: string) => Promise<void>;
  bulkUpdateTransactionStatus: (customerId: string, transactionIds: string[], status: 'paid' | 'unpaid') => Promise<void>;
  bulkDeleteTransactions: (customerId: string, transactionIds: string[]) => Promise<void>;
  importCustomers: (customers: Customer[]) => Promise<void>;
  currency: Currency;
  setCurrency: (currency: Currency) => Promise<void>;
  activeCustomerId: string | null;
  setActiveCustomerId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortKey: SortKey;
  setSortKey: (key: SortKey) => void;
  isLoading: boolean;
}

export const AppContext = createContext<AppContextType | null>(null);

const calculateStatus = (transaction: Pick<Transaction, 'receivable' | 'payable' | 'payments'>): 'paid' | 'unpaid' | 'partial' => {
  const totalPaid = (transaction.payments || []).reduce((acc, p) => acc + p.amount, 0);
  const totalDue = transaction.receivable > 0 ? transaction.receivable : transaction.payable;
  if (totalPaid >= totalDue) return 'paid';
  if (totalPaid > 0) return 'partial';
  return 'unpaid';
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, userProfile, isAuthLoading } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('lastEdited');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();

  const getCustomersCollection = () => {
    if (!userProfile?.teamId) throw new Error("User is not part of a team.");
    return collection(db, `teams/${userProfile.teamId}/customers`);
  }

  const logUserActivity = (action: string, details: Record<string, any>) => {
    if(userProfile?.teamId && user?.uid && userProfile?.displayName) {
        logActivity(userProfile.teamId, user.uid, userProfile.displayName, action, details);
    }
  }

  useEffect(() => {
    if (!user || !userProfile?.teamId) {
      setIsDataLoading(false);
      setCustomers([]);
      return;
    };
    
    setIsDataLoading(true);

    const customersQuery = query(getCustomersCollection(), orderBy("lastEdited", "desc"));
    const unsubscribeCustomers = onSnapshot(customersQuery, (querySnapshot) => {
      const customersData: Customer[] = [];
      querySnapshot.forEach((doc) => {
        customersData.push({ id: doc.id, ...doc.data() } as Customer);
      });
      setCustomers(customersData);
      setIsDataLoading(false);
    }, (error) => {
      console.error("Error fetching customers from Firestore:", error);
      toast({ variant: "destructive", title: "Database Error", description: "Could not connect to the database." });
      setIsDataLoading(false);
    });

    return () => {
      unsubscribeCustomers();
    }
  }, [user, userProfile?.teamId, toast]);

   useEffect(() => {
    if(userProfile?.currency) {
      setCurrency(userProfile.currency);
    }
  }, [userProfile?.currency]);

  const setCurrencyAndSave = async (newCurrency: Currency) => {
    setCurrency(newCurrency);
    if (!user) return;
    const profileRef = doc(db, 'userProfiles', user.uid);
    try {
      await setDoc(profileRef, { currency: newCurrency }, { merge: true });
    } catch (error) {
      console.error("Failed to save currency to Firestore", error);
      toast({ variant: "destructive", title: "Error", description: "Could not save currency preference." });
    }
  };
  
  const addCustomer = async (name: string, phoneNumber?: string) => {
    const newCustomer: Omit<Customer, 'id'> = {
      name,
      phoneNumber: phoneNumber || '',
      dateAdded: new Date().toISOString(),
      lastEdited: new Date().toISOString(),
      transactions: [],
    };
    try {
      const docRef = await addDoc(getCustomersCollection(), newCustomer);
      setActiveCustomerId(docRef.id);
      logUserActivity("Created Customer", { customerName: name, customerId: docRef.id });
      toast({ title: "Customer Added", description: `${name} has been added successfully.` });
    } catch (error) {
      console.error("Error adding customer: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not add customer." });
    }
  };

  const updateCustomer = async (id: string, name: string, phoneNumber?: string) => {
    const customerRef = doc(getCustomersCollection(), id);
    try {
      await updateDoc(customerRef, {
        name,
        phoneNumber: phoneNumber || '',
        lastEdited: new Date().toISOString()
      });
      logUserActivity("Updated Customer", { customerName: name, customerId: id });
      toast({ title: "Customer Updated", description: "Customer details have been updated." });
    } catch (error) {
      console.error("Error updating customer: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update customer." });
    }
  };

  const softDeleteCustomer = async (id: string) => {
    const customerRef = doc(getCustomersCollection(), id);
    try {
      const customerSnap = await getDoc(customerRef);
      const customerName = customerSnap.exists() ? customerSnap.data().name : 'Unknown';
      await updateDoc(customerRef, {
        dateRemoved: new Date().toISOString()
      });
      setActiveCustomerId(null);
      logUserActivity("Deleted Customer", { customerName, customerId: id });
      toast({ title: "Customer Removed", description: "Customer has been moved to archives." });
    } catch (error) {
      console.error("Error removing customer: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not remove customer." });
    }
  };

  const addTransaction = async (customerId: string, transaction: Omit<Transaction, 'id' | 'date' | 'status' | 'payments'>) => {
    const newTransaction: Omit<Transaction, 'status'> = {
      ...transaction,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      payments: [],
    };
    const status = calculateStatus(newTransaction);
    const fullTransaction: Transaction = { ...newTransaction, status };

    const customerRef = doc(getCustomersCollection(), customerId);
    try {
      const customerSnap = await getDoc(customerRef);
      const customerName = customerSnap.exists() ? customerSnap.data().name : 'Unknown';

      await updateDoc(customerRef, {
        transactions: arrayUnion(fullTransaction),
        lastEdited: new Date().toISOString()
      });
      logUserActivity("Added Transaction", { 
        customerName, 
        customerId, 
        product: transaction.productName,
        amount: transaction.receivable || transaction.payable,
        type: transaction.receivable > 0 ? 'receivable' : 'payable'
      });
      toast({ title: "Transaction Added", description: `New transaction for ${transaction.productName} has been added.` });
    } catch (error) {
      console.error("Error adding transaction: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not add transaction." });
    }
  };

  const updateTransaction = async (customerId: string, updatedTransaction: Transaction) => {
     const customerRef = doc(getCustomersCollection(), customerId);
     try {
       const customerSnap = await getDoc(customerRef);
       if (customerSnap.exists()) {
         const customerData = customerSnap.data() as Omit<Customer, 'id'>;
         const updatedTransactions = customerData.transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
         await updateDoc(customerRef, {
           transactions: updatedTransactions,
           lastEdited: new Date().toISOString()
         });
         logUserActivity("Updated Transaction", { 
            customerName: customerData.name, 
            customerId, 
            product: updatedTransaction.productName,
            transactionId: updatedTransaction.id
         });
         toast({ title: "Transaction Updated", description: "The transaction has been updated." });
       }
     } catch (error) {
       console.error("Error updating transaction: ", error);
       toast({ variant: "destructive", title: "Error", description: "Could not update transaction." });
     }
  };
  
  const deleteTransaction = async (customerId: string, transactionId: string) => {
     const customerRef = doc(getCustomersCollection(), customerId);
     try {
       const customerSnap = await getDoc(customerRef);
       if (customerSnap.exists()) {
         const customerData = customerSnap.data() as Omit<Customer, 'id'>;
         const transactionToRemove = customerData.transactions.find(t => t.id === transactionId);
         if (transactionToRemove) {
           await updateDoc(customerRef, {
             transactions: arrayRemove(transactionToRemove),
             lastEdited: new Date().toISOString()
           });
           logUserActivity("Deleted Transaction", { 
              customerName: customerData.name, 
              customerId, 
              product: transactionToRemove.productName,
              transactionId
           });
           toast({ title: "Transaction Deleted", description: "The transaction has been deleted." });
         }
       }
     } catch(error) {
       console.error("Error deleting transaction: ", error);
       toast({ variant: "destructive", title: "Error", description: "Could not delete transaction." });
     }
  };

  const toggleTransactionStatus = async (customerId: string, transactionId: string) => {
    // This function is now less relevant but can be used to quickly mark as fully paid/unpaid
    const customerRef = doc(getCustomersCollection(), customerId);
    try {
      const customerSnap = await getDoc(customerRef);
      if (customerSnap.exists()) {
        const customerData = customerSnap.data() as Omit<Customer, 'id'>;
        const updatedTransactions = customerData.transactions.map(t => {
          if (t.id === transactionId) {
            const totalDue = t.receivable > 0 ? t.receivable : t.payable;
            const newPayments = t.status === 'paid' ? [] : [{ id: Date.now().toString(), amount: totalDue, date: new Date().toISOString() }];
            const updatedTransaction = { ...t, payments: newPayments };
            const newStatus = calculateStatus(updatedTransaction);
            return { ...updatedTransaction, status: newStatus };
          }
          return t;
        });
        await updateDoc(customerRef, {
          transactions: updatedTransactions,
          lastEdited: new Date().toISOString()
        });
        const newStatus = updatedTransactions.find(t => t.id === transactionId)?.status;
        logUserActivity(`Toggled transaction status to ${newStatus}`, { customerId, transactionId });
      }
    } catch(error) {
      console.error("Error toggling transaction status: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update transaction status." });
    }
  };

  const addPayment = async (customerId: string, transactionId: string, amount: number) => {
    const customerRef = doc(getCustomersCollection(), customerId);
    try {
        const customerSnap = await getDoc(customerRef);
        if (customerSnap.exists()) {
            const customerData = customerSnap.data() as Customer;
            const updatedTransactions = customerData.transactions.map(t => {
                if (t.id === transactionId) {
                    const newPayment: Payment = {
                        id: Date.now().toString(),
                        amount,
                        date: new Date().toISOString(),
                    };
                    const updatedPayments = [...(t.payments || []), newPayment];
                    const updatedTransaction = { ...t, payments: updatedPayments };
                    const newStatus = calculateStatus(updatedTransaction);
                    return { ...updatedTransaction, status: newStatus };
                }
                return t;
            });
            await updateDoc(customerRef, {
                transactions: updatedTransactions,
                lastEdited: new Date().toISOString()
            });
            logUserActivity("Added Payment", { customerId, transactionId, amount });
            toast({ title: "Payment Added", description: "The payment has been recorded." });
        }
    } catch (error) {
        console.error("Error adding payment:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not add payment." });
    }
  };

  const deletePayment = async (customerId: string, transactionId: string, paymentId: string) => {
    const customerRef = doc(getCustomersCollection(), customerId);
    try {
        const customerSnap = await getDoc(customerRef);
        if (customerSnap.exists()) {
            const customerData = customerSnap.data() as Customer;
            const updatedTransactions = customerData.transactions.map(t => {
                if (t.id === transactionId) {
                    const updatedPayments = (t.payments || []).filter(p => p.id !== paymentId);
                    const updatedTransaction = { ...t, payments: updatedPayments };
                    const newStatus = calculateStatus(updatedTransaction);
                    return { ...updatedTransaction, status: newStatus };
                }
                return t;
            });
            await updateDoc(customerRef, {
                transactions: updatedTransactions,
                lastEdited: new Date().toISOString()
            });
            logUserActivity("Deleted Payment", { customerId, transactionId, paymentId });
            toast({ title: "Payment Deleted", description: "The payment has been removed." });
        }
    } catch (error) {
        console.error("Error deleting payment:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not delete payment." });
    }
  };

  const bulkUpdateTransactionStatus = async (customerId: string, transactionIds: string[], status: 'paid' | 'unpaid') => {
    const customerRef = doc(getCustomersCollection(), customerId);
    try {
      const customerSnap = await getDoc(customerRef);
      if (customerSnap.exists()) {
        const customerData = customerSnap.data() as Omit<Customer, 'id'>;
        const updatedTransactions = customerData.transactions.map(t => {
          if (transactionIds.includes(t.id)) {
            const totalDue = t.receivable > 0 ? t.receivable : t.payable;
            const newPayments = status === 'paid' ? [{ id: Date.now().toString(), amount: totalDue, date: new Date().toISOString() }] : [];
            const updatedTransaction = { ...t, payments: newPayments, status };
            return updatedTransaction;
          }
          return t;
        });
        await updateDoc(customerRef, {
          transactions: updatedTransactions,
          lastEdited: new Date().toISOString()
        });
        logUserActivity(`Bulk updated ${transactionIds.length} transactions to ${status}`, { customerId, transactionIds, status });
        toast({ title: "Bulk Update Successful", description: `${transactionIds.length} transaction(s) have been updated.` });
      }
    } catch (error) {
      console.error("Error during bulk update:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not perform bulk update." });
    }
  };

  const bulkDeleteTransactions = async (customerId: string, transactionIds: string[]) => {
    const customerRef = doc(getCustomersCollection(), customerId);
    try {
      const customerSnap = await getDoc(customerRef);
      if (customerSnap.exists()) {
        const customerData = customerSnap.data() as Omit<Customer, 'id'>;
        const updatedTransactions = customerData.transactions.filter(t => !transactionIds.includes(t.id));
        await updateDoc(customerRef, {
          transactions: updatedTransactions,
          lastEdited: new Date().toISOString()
        });
        logUserActivity(`Bulk deleted ${transactionIds.length} transactions`, { customerId, transactionIds });
        toast({ title: "Bulk Delete Successful", description: `${transactionIds.length} transaction(s) have been deleted.` });
      }
    } catch (error) {
      console.error("Error during bulk delete:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not perform bulk delete." });
    }
  };
  
  const importCustomers = async (newCustomers: Customer[]) => {
    try {
      if (!Array.isArray(newCustomers) || newCustomers.length === 0 || newCustomers.some(c => !c.id || !c.name || !Array.isArray(c.transactions))) {
        throw new Error("Invalid or empty data format.");
      }
      
      setIsDataLoading(true);
      const batch = writeBatch(db);
      newCustomers.forEach(customer => {
        const customerWithPhone = { ...customer, phoneNumber: customer.phoneNumber || '' };
        const { id, ...customerData } = customerWithPhone;
        const docRef = doc(getCustomersCollection(), id);
        batch.set(docRef, customerData);
      });
      await batch.commit();

      setActiveCustomerId(null);
      setSearchQuery('');
      logUserActivity(`Imported ${newCustomers.length} customers`, { count: newCustomers.length });
      toast({ title: "Import Successful", description: `${newCustomers.length} customers and their transactions have been imported.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Import Failed", description: e.message || "Could not parse the file." });
    } finally {
      setIsDataLoading(false);
    }
  };

  const isLoading = isAuthLoading || isDataLoading;

  const contextValue = useMemo(() => ({
    customers,
    addCustomer,
    updateCustomer,
    softDeleteCustomer,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    toggleTransactionStatus,
    addPayment,
    deletePayment,
    bulkUpdateTransactionStatus,
    bulkDeleteTransactions,
    importCustomers,
    currency,
    setCurrency: setCurrencyAndSave,
    activeCustomerId,
    setActiveCustomerId: (id: string | null) => setActiveCustomerId(id),
    searchQuery,
    setSearchQuery: (q: string) => setSearchQuery(q),
    sortKey,
    setSortKey: (k: SortKey) => setSortKey(k),
    isLoading
  }), [customers, currency, activeCustomerId, searchQuery, sortKey, isLoading, user, userProfile]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
