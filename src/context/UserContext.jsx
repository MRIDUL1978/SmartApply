import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { db } from "../config/firebase"
import { doc, onSnapshot } from "firebase/firestore";
const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const {user} = useAuth();
  const [userData, setuserData] = useState(null);
  const [loading, setloading] = useState(false);

  useEffect(() => {
    if(!user){
      return;
    }

    setloading(true);
    const docRef = doc(db,"users",user.uid);

    const unsubscribe = onSnapshot(docRef,(docSnap)=>{
      if(docSnap.exists()){
        setuserData(docSnap.data())
      } 
      else{
        setuserData(null);
      }
      setloading(false)
    },(err)=>{
      console.error('Error fetching user Data',err);
      setloading(false);
    });

    return ()=> unsubscribe();
  }, [user])

  useEffect(() => {
    if(!user){
      setuserData(null);
      setloading(false);
    }
  }, [user])

  return (
    <UserContext.Provider
      value={{ userData, loading}}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
