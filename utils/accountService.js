import { doc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { db } from "../src/config/firebase"; 

export const permanentlyDeleteAccount = async (user) => {
  if (!user) throw new Error("No user currently logged in.");


  const historyRef = collection(db, "users", user.uid, "history");
  const historySnap = await getDocs(historyRef);
  
  const deletePromises = historySnap.docs.map((historyDoc) => 
    deleteDoc(doc(db, "users", user.uid, "history", historyDoc.id))
  );
  await Promise.all(deletePromises);

  await deleteDoc(doc(db, "users", user.uid));

  await deleteUser(user);

  return true; 
};