import express, { Request, Response } from 'express';
import cors from 'cors';
import { JSDOM } from 'jsdom';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import * as Babel from '@babel/core';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Setup JSDOM for server-side rendering (some components may expect window/document)
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable',
});

declare global {
  var window: Window & typeof globalThis;
  var document: Document;
  var navigator: Navigator;
}

// Expose window/document to components that expect them
let globalAny: any = { ...globalThis };
globalAny.window = dom.window as any;
globalAny.document = dom.window.document;
globalAny.navigator = dom.window.navigator;


// Load components from node_modules package 
let predefinedComponents: Record<string, any> = {};
try {
  const componentsPackage = '@react-renderer/components';
  const mod = require(componentsPackage);
  predefinedComponents = {
    ...(mod && mod.default ? mod.default : {}),
    ...(mod || {}),
  };
  delete predefinedComponents.__esModule;
  console.log(
    `🎨 Loaded ${Object.keys(predefinedComponents).length
    } components from ${componentsPackage}:`,
    Object.keys(predefinedComponents)
  );
} catch (err: any) {
  console.error('❌ Failed to load components from node_modules/@react-renderer/components');
  console.error('💡 Make sure to run: npm run build:components');
  console.error('Error:', err?.message || err);
  process.exit(1);
}

// ---- Types ----
interface RenderRequest {
  code: string;
  props?: Record<string, any>;
}

interface RenderResponse {
  success: boolean;
  html?: string;
  error?: string;
  stack?: string;
  message?: string;
}

interface HealthResponse {
  status: string;
  message: string;
}

app.use('/styles.css', express.static(path.join(__dirname, './styles.css')));

// ---- POST /render ----
// Accepts JSON: { "code": "<Button>HI</Button>", "props": { ... } }
app.post(
  '/render',
  async (
    req: Request<{}, RenderResponse, RenderRequest>,
    res: Response<RenderResponse>
  ) => {
    try {
      const { code, props = {} } = req.body ?? {};

      if (!code || typeof code !== 'string') {
        return res
          .status(400)
          .json({ success: false, error: 'No code provided' });
      }

      // The user code should already be a complete component
      const userSource = `${code}\nmodule.exports = MyComponent;`;
      // Transform JSX -> JS
      const transformed = Babel.transformSync(userSource, {
        filename: 'user-code.jsx',
        presets: [
          ['@babel/preset-react', { runtime: 'automatic' }],
          ['@babel/preset-env', { targets: { node: '18' } }],
        ],
        babelrc: false,
        configFile: false,
      });

      if (!transformed?.code) throw new Error('Babel transform failed');

      // Provide context (React, props, console, and require function)
      const context: Record<string, any> = {
        React,
        props,
        console,
        require: (moduleName: string) => {
          if (moduleName === '@react-renderer/components') {
            return predefinedComponents;
          }
          return require(moduleName);
        },
      };

      // Evaluate inside a function scope
      const contextKeys = Object.keys(context);
      const contextValues = Object.values(context);

      // The transformed code sets module.exports = __User
      const execFn = new Function('module', ...contextKeys, transformed.code);
      const moduleObj: any = { exports: {} };
      execFn(moduleObj, ...contextValues);

      const ComponentFactory = moduleObj.exports;

      if (
        !ComponentFactory ||
        (typeof ComponentFactory !== 'function' &&
          typeof ComponentFactory !== 'object')
      ) {
        throw new Error('No valid component factory returned from user code');
      }

      // Create element and render to string
      const element = React.createElement(ComponentFactory, props);
      const html = ReactDOMServer.renderToString(element);

      // Read the CSS file and inline it
      const cssPath = path.join(__dirname, '../node_modules/@react-renderer/components/styles.css');
      let cssContent = '';
      try {
        console.log('CSS path:', cssPath);
        cssContent = fs.readFileSync(cssPath, 'utf8');
        console.log('CSS loaded successfully, size:', cssContent.length);
      } catch (err) {
        console.warn('Could not read CSS file:', err);
        // Try alternative path
        const altCssPath = path.join(process.cwd(), 'dist', 'styles.css');
        try {
          cssContent = fs.readFileSync(altCssPath, 'utf8');
          console.log('CSS loaded from alternative path, size:', cssContent.length);
        } catch (altErr) {
          console.warn('Could not read CSS from alternative path:', altErr);
        }
      }

      // Generate complete HTML document
      const completeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Component</title>
    <style>
        ${cssContent}
    </style>
</head>
<body>
    <div id="app">
        ${html}
    </div>
    
</body>
</html>`;

      res.json({
        success: true,
        html: completeHTML,
        message: 'Complete HTML document generated successfully',
      });
    } catch (error: any) {
      console.error('Rendering error:', error);
      res.status(400).json({
        success: false,
        error: error?.message || String(error),
        stack:
          process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      });
    }
  }
);

// ---- Health check ----
app.get('/health', (req, res: Response<HealthResponse>) => {
  res.json({ status: 'OK', message: 'React SSR service is running' });
});

// ---- Get available components ----
app.get('/components', (req, res) => {
  const componentNames = Object.keys(predefinedComponents).map(name => ({ name }));
  res.json({
    success: true,
    components: componentNames,
    count: componentNames.length
  });
});

app.listen(PORT, () => {
  console.log(`🚀 React SSR Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Render endpoint: POST http://localhost:${PORT}/render`);
});

