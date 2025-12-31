#!/bin/bash

# setup-opencode.sh
# Sets up OpenCode for the Ckick project

set -e

echo "🚀 Setting up OpenCode for Ckick..."

# Check if opencode-ai is installed
if command -v opencode &> /dev/null; then
    echo "✅ OpenCode is already installed"
else
    echo "📦 Installing OpenCode..."
    npm install -g opencode-ai
fi

# Set up the EDITOR environment variable
echo "⚙️  Setting up EDITOR environment variable..."
export EDITOR="${EDITOR:-nvim}"

# Create .env.local from .env.example if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your actual environment values"
fi

# Run /init to initialize OpenCode
echo "🔧 Initializing OpenCode..."
opencode /init

echo ""
echo "✅ OpenCode setup complete!"
echo ""
echo "To start using OpenCode, run:"
echo "  opencode"
echo ""
echo "Make sure your .env.local file is properly configured."
