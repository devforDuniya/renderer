#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');



async function installComponents() {
  console.log('🚀 Installing shadcn/ui components directly from library...');
  
  // Clean and create temp directory
  const tempDir = path.join(process.cwd(), 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  // Create subdirectories
  const dirs = ['components', 'lib', 'hooks'];
  dirs.forEach(dir => {
    const dirPath = path.join(tempDir, dir);
    fs.mkdirSync(dirPath, { recursive: true });
  });

  // Create a proper package.json for shadcn CLI
  const packageJson = {
    "name": "temp-components",
    "version": "1.0.0",
    "private": true,
    "scripts": {
      "install:components": "npx shadcn@latest add --all --yes"
    },
    "dependencies": {
      "react": "^18.0.0",
      "react-dom": "^18.0.0",
      "tailwind-merge": "^3.3.1",
      "clsx": "^2.1.1",
      "class-variance-authority": "^0.7.1"
    },
    "devDependencies": {
      "typescript": "^5.0.0",
      "@types/react": "^18.0.0",
      "@types/react-dom": "^18.0.0"
    }
  };

  // Write package.json to temp directory
  fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  console.log('✅ Created package.json for shadcn CLI');

  // copy css from root to temp
  fs.copyFileSync(path.join(process.cwd(), 'index.css'), path.join(tempDir, 'index.css'));
  console.log('✅ Copied css from root to temp');

  // Create a proper components.json for shadcn CLI
  const componentsJson = {
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "new-york",
    "rsc": true,
    "tsx": true,
    "tailwind": {
      "config": "tailwind.config.js",
      "css": "index.css",
      "baseColor": "neutral",
      "cssVariables": true,
      "prefix": ""
    },
    "iconLibrary": "lucide",
    "aliases": {
      "components": "@/components",
      "utils": "@/lib/utils",
      "ui": "@/components/ui",
      "lib": "@/lib",
      "hooks": "@/hooks"
    },
    "registries": {}
  };
  // content of lib/utils.ts
  const libUtils = `
  import { twMerge } from "tailwind-merge";
  import { clsx } from "clsx";

  export function cn(...inputs) {
    return twMerge(clsx(inputs));
  }
  `;

  // Write lib/utils.ts to temp directory
  fs.writeFileSync(path.join(tempDir, 'lib/utils.ts'), libUtils);
  console.log('✅ Created lib/utils.ts for shadcn CLI');

  // Create tsconfig.json with proper path resolution
  const tsconfigJson = {
    "compilerOptions": {
      "target": "ES2017",
      "lib": ["dom", "dom.iterable", "es6"],
      "allowJs": true,
      "skipLibCheck": true,
      "strict": true,
      "noEmit": true,
      "esModuleInterop": true,
      "module": "esnext",
      "moduleResolution": "bundler",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "preserve",
      "incremental": true,
      "plugins": [
        {
          "name": "next"
        }
      ],
      "baseUrl": ".",
      "paths": {
        "@/*": ["./*"]
      }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
  };

  // Write tsconfig.json to temp directory
  fs.writeFileSync(path.join(tempDir, 'tsconfig.json'), JSON.stringify(tsconfigJson, null, 2));
  console.log('✅ Created tsconfig.json for shadcn CLI');

  // Write components.json to temp directory
  fs.writeFileSync(path.join(tempDir, 'components.json'), JSON.stringify(componentsJson, null, 2));
  console.log('✅ Created components.json for shadcn CLI');

  // copy tailwind.config.js from root to temp
  fs.copyFileSync(path.join(process.cwd(), 'tailwind.config.js'), path.join(tempDir, 'tailwind.config.js'));
  console.log('✅ Copied tailwind.config.js from root to temp');

  console.log('📦 Installing shadcn/ui components using CLI...');
  
  // Install each component using shadcn CLI

  try {
    console.log(`Installing all components... at `, tempDir);
    // Use shadcn CLI to install component directly
    // Set working directory and ensure we're isolated from parent project
    execSync(`npx shadcn@latest add --all --yes`, { 
      stdio: 'inherit',
      cwd: tempDir,
      env: {
        ...process.env,
        // Ensure we don't inherit any parent project context
        INIT_CWD: tempDir
      }
    });
    console.log(`✅ All components installed successfully`);
  } catch (error) {
    console.warn(`⚠️ Failed to install all components:`, error.message);
    // Continue with other components even if one fails
  }

  console.log('✅ Component installation completed!');
  console.log('📁 Components installed in temp/ directory');
  console.log('🔧 Components are now available for transpilation from node_modules');
}

installComponents().catch(console.error);