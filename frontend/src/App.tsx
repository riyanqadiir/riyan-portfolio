import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
    Main,
    Timeline,
    Expertise,
    Project,
    Contact,
    Navigation,
    Footer,
    Admin,
} from "./components";
import FadeIn from './components/FadeIn';
import './index.scss';

function App() {
    const [mode, setMode] = useState<string>('dark');

    const handleModeChange = () => {
        if (mode === 'dark') {
            setMode('light');
        } else {
            setMode('dark');
        }
    }

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, []);

    return (
        <Router>
            <Routes>
                <Route path="/" element={
                    <div className={`main-container ${mode === 'dark' ? 'dark-mode' : 'light-mode'}`}>
                        <Navigation parentToChild={{ mode }} modeChange={handleModeChange} />
                        <FadeIn transitionDuration={700}>
                            <Main />
                            <Expertise />
                            <Timeline />
                            <Project />
                            <Contact />
                        </FadeIn>
                        <Footer />
                    </div>
                } />
                <Route path="/admin" element={<Admin mode={mode} />} />
            </Routes>
        </Router>
    );
}

export default App;