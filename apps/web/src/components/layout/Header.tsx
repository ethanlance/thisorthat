'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-primary">ThisOrThat</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </a>
            <a
              href="/polls"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Polls
            </a>
            <a
              href="/create"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Create
            </a>
            <a
              href="/about"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="flex flex-col space-y-2 py-4">
              <a
                href="/"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="/polls"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Polls
              </a>
              <a
                href="/create"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Create
              </a>
              <a
                href="/about"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
