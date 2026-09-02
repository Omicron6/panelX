import React from 'react';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-16 px-6" data-testid="footer">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <img
                src="https://customer-assets.emergentagent.com/job_hi-hub-7/artifacts/bcdp0q1j_panelX_logo.png"
                alt="PanelX Logo"
                className="h-12 w-12 object-contain"
              />
              <span className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Bebas Neue' }}>
                PANELX
              </span>
            </div>
            <p className="text-gray-600 mb-6 max-w-md">
              AI-powered interview platform that transforms how companies screen and evaluate candidates.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-100 hover:bg-purple-100 flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5 text-gray-700 hover:text-purple-600" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-100 hover:bg-purple-100 flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5 text-gray-700 hover:text-purple-600" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-100 hover:bg-purple-100 flex items-center justify-center transition-colors">
                <Github className="w-5 h-5 text-gray-700 hover:text-purple-600" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-100 hover:bg-purple-100 flex items-center justify-center transition-colors">
                <Mail className="w-5 h-5 text-gray-700 hover:text-purple-600" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-gray-900" style={{ fontFamily: 'Bebas Neue' }}>Product</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-gray-600 hover:text-purple-600 transition-colors">Features</a></li>
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Pricing</a></li>
              <li><a href="#api" className="text-gray-600 hover:text-purple-600 transition-colors">API</a></li>
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Documentation</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-gray-900" style={{ fontFamily: 'Bebas Neue' }}>Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">About</a></li>
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Blog</a></li>
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-600 text-sm mb-4 md:mb-0">
            © 2025 PanelX. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
