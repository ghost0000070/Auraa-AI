export const Footer = () => {
  return (
    <footer className="py-16 px-6 border-t border-border">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 rounded-lg hero-gradient flex items-center justify-center">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <span className="text-xl font-bold text-gradient">Auraa-AI</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The world's first AI workforce platform. Create, manage, and scale your AI employees with advanced analytics and automation.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#ai-employees" className="hover:text-foreground transition-colors">AI Employees</a></li>
              <li><a href="#analytics" className="hover:text-foreground transition-colors">Analytics</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="mailto:hello@auraa.ai" className="hover:text-foreground transition-colors">Contact Sales</a></li>
              <li><a href="mailto:careers@auraa.ai" className="hover:text-foreground transition-colors">Careers</a></li>
              <li><a href="https://blog.auraa.ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Blog</a></li>
              <li><a href="mailto:hello@auraa.ai" className="hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://help.auraa.ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Help Center</a></li>
              <li><a href="https://docs.auraa.ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Documentation</a></li>
              <li><a href="https://status.auraa.ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Status</a></li>
              <li><a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Auraa-AI. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="https://twitter.com/auraa-ai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="sr-only">Twitter</span>
              🐦
            </a>
            <a href="https://linkedin.com/company/auraa-ai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="sr-only">LinkedIn</span>
              💼
            </a>
            <a href="https://github.com/auraa-ai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="sr-only">GitHub</span>
              🐙
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};