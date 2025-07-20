import React from 'react';
import './index.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">Mintfinity.AI</div>
            <p className="footer-tagline">
              Revolutionizing ICRC token management through intelligent AI-powered 
              interactions on the Internet Computer blockchain.
            </p>
            <div className="footer-social">
              <a href="#" className="footer-social-link" aria-label="Twitter">
                🐦
              </a>
              <a href="#" className="footer-social-link" aria-label="Discord">
                💬
              </a>
              <a href="#" className="footer-social-link" aria-label="GitHub">
                🐙
              </a>
              <a href="#" className="footer-social-link" aria-label="Telegram">
                ✈️
              </a>
            </div>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-section-title">Product</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Features</a></li>
              <li><a href="#" className="footer-link">Documentation</a></li>
              <li><a href="#" className="footer-link">API Reference</a></li>
              <li><a href="#" className="footer-link">Pricing</a></li>
              <li><a href="#" className="footer-link">Roadmap</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-section-title">Developers</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">SDK</a></li>
              <li><a href="#" className="footer-link">Tutorials</a></li>
              <li><a href="#" className="footer-link">Code Examples</a></li>
              <li><a href="#" className="footer-link">Community</a></li>
              <li><a href="#" className="footer-link">Support</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-section-title">Company</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">About</a></li>
              <li><a href="#" className="footer-link">Blog</a></li>
              <li><a href="#" className="footer-link">Careers</a></li>
              <li><a href="#" className="footer-link">Contact</a></li>
              <li><a href="#" className="footer-link">Partners</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-copyright">
            © 2024 Mintfinity.AI. All rights reserved.
          </div>
          <ul className="footer-legal">
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Cookie Policy</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;