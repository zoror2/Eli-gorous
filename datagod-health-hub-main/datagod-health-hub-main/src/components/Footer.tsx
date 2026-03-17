import { PRODUCT_URL } from "@/lib/config";

const Footer = () => (
  <footer className="py-16 border-t border-border/50">
    <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
      <a href="#" className="text-xl font-bold tracking-tight text-foreground">
        Data<span className="text-primary">God</span> Health
      </a>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Hospital intelligence. One conversation away.
      </p>
      <button
        type="button"
        onClick={() => (window.location.href = PRODUCT_URL)}
        className="inline-flex h-10 px-6 items-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        Launch App
      </button>
      <p className="text-xs text-muted-foreground/50 pt-4">Built for Hackathon 2025</p>
    </div>
  </footer>
);

export default Footer;
