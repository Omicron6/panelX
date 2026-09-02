import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@/App.css';
import HeroSection from '@/components/HeroSection';
import ProblemSection from '@/components/ProblemSection';
import SolutionSection from '@/components/SolutionSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import FeaturesSection from '@/components/FeaturesSection';
import ResultsSection from '@/components/ResultsSection';
import ArchitectureSection from '@/components/ArchitectureSection';
import DeveloperAPISection from '@/components/DeveloperAPISection';
import FinalCTASection from '@/components/FinalCTASection';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoginPage from '@/components/LoginPage';
import AdminLayout from '@/layouts/AdminLayout';
import CandidateLayout from '@/layouts/CandidateLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import CreateSession from '@/pages/admin/CreateSession';
import Sessions from '@/pages/admin/Sessions';
import AdminResults from '@/pages/admin/Results';
import GeneratedQuestions from '@/pages/admin/GeneratedQuestions';
import CandidateDashboard from '@/pages/candidate/CandidateDashboard';
import Interviews from '@/pages/candidate/Interviews';
import Interview from '@/pages/candidate/Interview';
import CandidateResults from '@/pages/candidate/CandidateResults';

const LandingPage = () => {
  return (
    <div className="App bg-white min-h-screen">
      <Navbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <FeaturesSection />
        <ResultsSection />
        <ArchitectureSection />
        <DeveloperAPISection />
        <FinalCTASection />
        <Footer />
      </Suspense>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="create-session" element={<CreateSession />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="generated-questions" element={<GeneratedQuestions />} />
          <Route path="results" element={<AdminResults />} />
        </Route>
        
        {/* Candidate Routes */}
        <Route path="/candidate" element={<CandidateLayout />}>
          <Route path="dashboard" element={<CandidateDashboard />} />
          <Route path="interviews" element={<Interviews />} />
          <Route path="results" element={<CandidateResults />} />
        </Route>
        
        {/* Interview Route - Full Screen (No Layout) */}
        <Route path="/candidate/interview/:id" element={<Interview />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
