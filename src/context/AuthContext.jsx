import React from "react";
import { createContext, useState, useEffect, useContext } from "react";
import { auth } from "../config/firebase";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { FacebookAuthProvider } from "firebase/auth/web-extension";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const clientId = "223590547831-dljuu77tq6h7ckn2ne679rspakjhmfpn.apps.googleusercontent.com";

      const redirectUri = chrome.identity.getRedirectURL();
      const scopes = ['email', 'profile', 'openid'];

      const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes.join(" "))}&prompt=select_account`;


      chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, async (responseUrl) => {
        if (chrome.runtime.lastError || !responseUrl) {
          return;
        }

        const url = new URL(responseUrl);
        const code = new URLSearchParams(url.hash.substring(1));
        const token = code.get("access_token");

        if(!token){
          toast.error("No google account found");
          return;
        }

        const credential = GoogleAuthProvider.credential(null, token);
        await signInWithCredential(auth, credential);
        toast.success("Login Successful");
      });
    } catch {
      toast.error("Login Failed");
    }
  };

  const signInWithFacebook = async () => {
    try{
      const facebookAppId = "1962297734698708";
      const redirectUri = chrome.identity.getRedirectURL();
      const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token`;

      chrome.identity.launchWebAuthFlow({url:authUrl,interactive:true},async(responseUrl)=>{
        if(chrome.identity.lastError || !responseUrl){
          toast.error("Facebook login failed");
          return;
        }

        const url = new URL(responseUrl);
        const code = new URLSearchParams(url.hash.substring(1));
        const token = code.get("access_token");

        if(!token){
          toast.error("No facebook account found");
          return;
        }

        const credential = FacebookAuthProvider.credential(token);
        await signInWithCredential(auth, credential);
        toast.success("Login Successful");
      });
    }catch(err){
      console.error(err);
      toast.error('Login Failed');
    }
  }

  const logOut = async () => {
    try {
      chrome.identity.getAuthToken({ interactive: false },async(token)=>{
        if(token){
          try{
            await fetch('https://accounts.google.com/o/oauth2/revoke?token=' + token);
          }catch(err){
            console.error("Token Revoke Error",err);
          }

          chrome.identity.removeCachedAuthToken({token:token},async ()=>{
            await performFirebaseLogout();
          })
        }else{
          await performFirebaseLogout();
        }
      });
    } catch (err) {
      console.error('Logout Error',err);
    }
  };  

  const performFirebaseLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate("/");
    } catch (err) {
      console.error('Perform Firebase Logout Error',err);
    }
  }

  const resetPassword = async (email) => {
    try {
      await (sendPasswordResetEmail(auth, email));
      toast.success("Password Reset email sent!. Please check your inbox");
    } catch (err){
      console.error("Password Reset error ", err);
      if(err.code === 'auth/user-not-found') {
        toast.error("No account found with this email.");
      } else {
        toast.error("Failed to sent reset email. Please try again.");
      }
      throw err;
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithFacebook ,logOut , resetPassword }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);