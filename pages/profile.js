import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { gsap } from 'gsap';
import { User, Mail, Calendar, Target, Edit, LogOut, ArrowLeft } from 'lucide-react';

// --- Mock Data ---
// English: In a real app, this data would be fetched from your user authentication service.
// Hinglish: Ek real app mein, yeh data aapke user authentication service se fetch kiya jaayega.
const USER_DATA = {
    name: "Rohan Sharma",
    email: "rohan.sharma@example.com",
    memberSince: "August 10, 2023",
    dailyGoal: 25, // Number of questions to solve per day
};

// --- Main Profile Page Component ---
const ProfilePage = () => {
    const [dailyGoal, setDailyGoal] = useState(USER_DATA.dailyGoal);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        // GSAP Animations for page load
        gsap.fromTo(".profile-card, .profile-header", 
            { opacity: 0, y: 50 }, 
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out', delay: 0.3 }
        );
    }, []);

    const handleGoalChange = (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
            setDailyGoal(value);
        }
    };

    const handleUpdateProfile = () => {
        alert(`Profile updated! New daily goal: ${dailyGoal} questions.`);
        setIsEditing(false);
        // Here you would make an API call to save the new goal to the backend.
    };
    
    const handleLogout = () => {
        alert("Logging out...");
        // Handle logout logic here
    };

    const handleBackClick = () => alert("Navigating back to the dashboard...");

    return (
        <>
            <Head>
                <title>My Profile | JEE Solver</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
            </Head>

            <div className="min-h-screen bg-slate-900 text-gray-200 font-sans p-4 sm:p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <header className="profile-header flex items-center justify-between mb-10">
                         <button onClick={handleBackClick} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                            <ArrowLeft size={18} />
                            Back to Dashboard
                        </button>
                        <h1 className="text-3xl sm:text-4xl font-black text-white text-center">My Profile</h1>
                        <div className="w-32"></div> {/* Spacer */}
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left Column: User Avatar and Name */}
                        <div className="profile-card md:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                                <User size={64} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">{USER_DATA.name}</h2>
                            <p className="text-gray-400">{USER_DATA.email}</p>
                        </div>

                        {/* Right Column: User Details and Settings */}
                        <div className="profile-card md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-8">
                            <h3 className="text-2xl font-bold text-white mb-6">Account Details</h3>
                            <div className="space-y-6">
                                {/* Member Since */}
                                <div className="flex items-center gap-4">
                                    <Calendar className="text-blue-400" size={24} />
                                    <div>
                                        <p className="text-sm text-gray-400">Member Since</p>
                                        <p className="text-lg font-semibold text-white">{USER_DATA.memberSince}</p>
                                    </div>
                                </div>
                                
                                {/* Daily Goal */}
                                <div className="flex items-center gap-4">
                                    <Target className="text-green-400" size={24} />
                                    <div>
                                        <p className="text-sm text-gray-400">Daily Study Goal</p>
                                        {isEditing ? (
                                            <input 
                                                type="number" 
                                                value={dailyGoal}
                                                onChange={handleGoalChange}
                                                className="bg-black/20 border border-white/20 rounded-md p-1 w-24 text-lg font-semibold text-white"
                                            />
                                        ) : (
                                            <p className="text-lg font-semibold text-white">{dailyGoal} Questions / Day</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4">
                                {isEditing ? (
                                     <button onClick={handleUpdateProfile} className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all">
                                        Save Changes
                                    </button>
                                ) : (
                                    <button onClick={() => setIsEditing(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all">
                                        <Edit size={18} /> Edit Profile
                                    </button>
                                )}
                               
                                <button onClick={handleLogout} className="w-full sm:w-auto bg-red-600/80 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all">
                                    <LogOut size={18} /> Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfilePage;
