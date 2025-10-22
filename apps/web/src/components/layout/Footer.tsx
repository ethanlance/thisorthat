export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">ThisOrThat</h3>
            <p className="text-sm text-muted-foreground">
              Make decisions easier with quick polls and community insights.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Quick Links</h4>
            <div className="space-y-2">
              <a
                href="/polls"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Browse Polls
              </a>
              <a
                href="/poll/create"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Create Poll
              </a>
              <a
                href="/about"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                About Us
              </a>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Support</h4>
            <div className="space-y-2">
              <a
                href="/help"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Help Center
              </a>
              <a
                href="/contact"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact Us
              </a>
              <a
                href="/privacy"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2025 ThisOrThat. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
