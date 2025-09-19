#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function buildComponents() {
  console.log('🚀 Building React Renderer Components...');
  
  try {
    // // Step 1: Install shadcn components directly from library
    // console.log('\n📦 Step 1: Installing shadcn components from library...');
    // execSync('node scripts/install-components.js', { stdio: 'inherit' });
    
    // Step 2: Fix import paths in components
    // console.log('\n🔧 Step 2: Fixing import paths in components...');
    // execSync('node scripts/fix-imports.js', { stdio: 'inherit' });
    
    // Step 3: Create index files from installed components
    console.log('\n📝 Step 3: Creating index files from installed components...');
    
    const tempDir = path.join(process.cwd(), 'temp');
    const componentsDir = path.join(tempDir, 'components');
    const libDir = path.join(tempDir, 'lib');
    const hooksDir = path.join(tempDir, 'hooks');
    
    // Create components/index.ts
    const componentsIndexPath = path.join(componentsDir, 'index.ts');
    
    // Check if components are in ui subdirectory
    const uiDir = path.join(componentsDir, 'ui');
    let componentFiles = [];
    
    if (fs.existsSync(uiDir)) {
      // Components are in ui subdirectory
      componentFiles = fs.readdirSync(uiDir)
        .filter(file => file.endsWith('.ts') || file.endsWith('.tsx'))
        .map(file => `export * from './ui/${path.basename(file, path.extname(file))}';`)
        .join('\n');
    } else {
      // Components are directly in components directory
      componentFiles = fs.readdirSync(componentsDir)
        .filter(file => file.endsWith('.ts') || file.endsWith('.tsx'))
        .filter(file => file !== 'index.ts')
        .map(file => `export * from './${path.basename(file, path.extname(file))}';`)
        .join('\n');
    }
    console.log('componentFiles', componentFiles, 'componentsIndexPath', componentsIndexPath);
    fs.writeFileSync(componentsIndexPath, componentFiles);
    console.log('✅ Components index created with', componentFiles.split('\n').length, 'exports');
    
    // Create lib/index.ts
    const libIndexPath = path.join(libDir, 'index.ts');
    
    // Ensure utils.ts exists
    const utilsPath = path.join(libDir, 'utils.ts');
    if (!fs.existsSync(utilsPath)) {
      const utilsContent = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`;
      fs.writeFileSync(utilsPath, utilsContent);
      console.log('✅ Created utils.ts file');
    }
    
    if (fs.existsSync(libDir) && fs.readdirSync(libDir).length > 0) {
      const libFiles = fs.readdirSync(libDir)
        .filter(file => file.endsWith('.ts'))
        .filter(file => file !== 'index.ts')
        .map(file => `export * from './${path.basename(file, path.extname(file))}';`)
        .join('\n');
      fs.writeFileSync(libIndexPath, libFiles);
      console.log('✅ Lib index created with', libFiles.split('\n').length, 'exports');
    } else {
      // Create empty lib index if no files
      fs.writeFileSync(libIndexPath, '// No lib files found\n');
      console.log('✅ Lib index created (empty)');
    }
    
    // Create hooks/index.ts
    const hooksIndexPath = path.join(hooksDir, 'index.ts');
    if (fs.existsSync(hooksDir) && fs.readdirSync(hooksDir).length > 0) {
      const hookFiles = fs.readdirSync(hooksDir)
        .filter(file => file.endsWith('.ts'))
        .filter(file => file !== 'index.ts')
        .map(file => `export * from './${path.basename(file, path.extname(file))}';`)
        .join('\n');
      fs.writeFileSync(hooksIndexPath, hookFiles);
      console.log('✅ Hooks index created with', hookFiles.split('\n').length, 'exports');
    } else {
      // Create empty hooks index if no files
      fs.writeFileSync(hooksIndexPath, '// No hooks files found\n');
      console.log('✅ Hooks index created (empty)');
    }
    
    // Step 4: Create node_modules directory structure
    console.log('\n📁 Step 4: Creating node_modules structure...');
    const nodeModulesDir = path.join(process.cwd(), 'node_modules', '@react-renderer', 'components');
    if (!fs.existsSync(nodeModulesDir)) {
      fs.mkdirSync(nodeModulesDir, { recursive: true });
    }
    
    // Step 5: Build with tsup (bundles everything for transpilation)
    console.log('\n🔨 Step 5: Building with tsup...');
    execSync('npx tsup', { stdio: 'inherit' });
    
    // Step 6: Fix the nested components directory structure
    console.log('\n📁 Step 6: Fixing directory structure...');
    const componentsNestedDir = path.join(nodeModulesDir, 'components');
    if (fs.existsSync(componentsNestedDir)) {
      // Move files from components/components to components/
      const nestedComponentsDir = path.join(componentsNestedDir, 'components');
      if (fs.existsSync(nestedComponentsDir)) {
        const files = fs.readdirSync(nestedComponentsDir);
        files.forEach(file => {
          const srcPath = path.join(nestedComponentsDir, file);
          const destPath = path.join(nodeModulesDir, file);
          fs.renameSync(srcPath, destPath);
        });
        // Remove the empty nested directories
        fs.rmSync(nestedComponentsDir, { recursive: true, force: true });
        fs.rmSync(componentsNestedDir, { recursive: true, force: true });
        console.log('✅ Fixed nested components directory structure');
      }
    }
    
    // Step 7: Create package.json for the package
    console.log('\n📋 Step 7: Setting up package...');
    const packageJsonPath = path.join(nodeModulesDir, 'package.json');
    const packageJsonContent = {
      "name": "@react-renderer/components",
      "version": "1.0.0",
      "description": "React components for server-side rendering",
      "main": "index.js",
      "module": "index.mjs",
      "types": "index.d.ts",
      "exports": {
        ".": {
          "import": "./index.mjs",
          "require": "./index.js",
          "types": "./index.d.ts"
        },
        "./lib": {
          "import": "lib/index.mjs",
          "require": "lib/index.js",
          "types": "lib/index.d.ts"
        },
        "./hooks": {
          "import": "./hooks/index.mjs",
          "require": "./hooks/index.js",
          "types": "./hooks/index.d.ts"
        }
      },
      "files": [
        "*.js",
        "*.mjs",
        "*.d.ts",
        "lib/",
        "hooks/"
      ],
      "peerDependencies": {
        "react": ">=18.0.0",
        "react-dom": ">=18.0.0"
      },
      "dependencies": {
        "@radix-ui/react-slot": "^1.2.3",
        "class-variance-authority": "^0.7.1",
        "clsx": "^2.1.1",
        "tailwind-merge": "^3.3.1"
      }
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonContent, null, 2));
    console.log('✅ Created package.json');
    
    // Step 8: Clean up temp directory
    console.log('\n🧹 Step 8: Cleaning up temp directory...');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('✅ Temp directory cleaned up');
    }
    
    console.log('\n🎉 Build completed successfully!');
    console.log('📦 Components are now available in node_modules/@react-renderer/components');
    console.log('🔧 Components are bundled and ready for transpilation');
    console.log('💡 When transpiling, components will be available from node_modules');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildComponents();