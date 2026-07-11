import React, { useState } from "react";
import { Link } from "react-router";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoMdClose } from "react-icons/io";
import { FaFileUpload } from "react-icons/fa";
import { FaHistory } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { useAuth } from "../context/AuthContext";
import {MdDeleteForever} from "react-icons/md";

const Head = () => {
  const { user, logOut } = useAuth();
  const [menu, setMenu] = useState(false);


  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <nav className="relative z-50 flex items-center justify-between px-5 py-3 bg-white">
        <div>
          <Link to="/" onClick={() => setMenu(false)}>
            <h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer tracking-tight">
              Smart Apply 🚀
            </h1>
          </Link>
        </div>

        <div>
          <button
            onClick={() => setMenu(!menu)}
            className={`p-2 rounded-full transition-all duration-200 focus:outline-none ${menu ? "bg-gray-100 text-gray-900" : "hover:bg-gray-50 text-gray-600"}`}
          >
            <span className="material-symbols-outlined block">
              {menu ? <IoMdClose size={24} /> : <GiHamburgerMenu size={24} />}
            </span>
          </button>

          {menu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right mr-3">
              <ul className="flex flex-col">
                <Link to="/add-details" onClick={() => setMenu(false)}>
                  <li className="px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-3 cursor-pointer group">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">
                        <FaFileUpload size={18} />
                      </span>
                    </div>
                    <span>Upload Details</span>
                  </li>
                </Link>
                <Link to="/history" onClick={() => setMenu(false)}>
                  <li className="px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-3 cursor-pointer group">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">
                        <FaHistory size={18} />
                      </span>
                    </div>
                    <span>History</span>
                  </li>
                </Link>
                {!user ? (
                  <>
                    <Link to="/signup" onClick={() => setMenu(false)}>
                      <li className="px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-3 cursor-pointer group">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">
                            <CgProfile size={18} />
                          </span>
                        </div>
                        <span>Sign Up</span>
                      </li>
                    </Link>
                    <Link to="/login" onClick={() => setMenu(false)}>
                      <li className="px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-3 cursor-pointer group">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">
                            <CgProfile size={18} />
                          </span>
                        </div>
                        <span>Login</span>
                      </li>
                    </Link>
                  </>
                ) : (
                  <>
                  <button onClick={() => logOut()}>
                    <li className="px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-3 cursor-pointer group">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">
                          <CgProfile size={18} />
                        </span>
                      </div>
                      <span>Logout</span>
                    </li>
                  </button>

                  <div className="border-t border-gray-100 my-1"></div>
                  <Link to="/delete-account" onClick={() => setMenu(false)}>
                    <li className="px-4 py-3 hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors flex items-center gap-3 cursor-pointer group">
                      <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">
                          <MdDeleteForever size={20} />
                        </span>
                      </div>
                      <span className="font-medium">Delete Account</span>
                    </li>
                  </Link>

                </>  
                )}
              </ul>
            </div>
          )}
        </div>
      </nav>

      {/* Overlay to close menu when clicking outside */}
      {menu && (
        <div
          className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[1px] transition-opacity"
          onClick={() => setMenu(false)}
          aria-hidden="true"
        ></div>
      )}
    </header>
  );
};

export default Head;
