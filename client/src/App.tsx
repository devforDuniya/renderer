import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

const exampleCode = `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@react-renderer/components";

function MyComponent() {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      defaultValue="item-1"
    >
      <AccordionItem value="item-1">
        <AccordionTrigger>Product Information</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
            Our flagship product combines cutting-edge technology with sleek
            design. Built with premium materials, it offers unparalleled
            performance and reliability.
          </p>
          <p>
            Key features include advanced processing capabilities, and an
            intuitive user interface designed for both beginners and experts.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Shipping Details</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
            We offer worldwide shipping through trusted courier partners.
            Standard delivery takes 3-5 business days, while express shipping
            ensures delivery within 1-2 business days.
          </p>
          <p>
            All orders are carefully packaged and fully insured. Track your
            shipment in real-time through our dedicated tracking portal.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Return Policy</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
            We stand behind our products with a comprehensive 30-day return
            policy. If you&apos;re not completely satisfied, simply return the
            item in its original condition.
          </p>
          <p>
            Our hassle-free return process includes free return shipping and
            full refunds processed within 48 hours of receiving the returned
            item.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}`;

interface ComponentInfo {
  name: string;
}

interface RenderResponse {
  success: boolean;
  html?: string;
  error?: string;
  message?: string;
}

interface ComponentsResponse {
  success: boolean;
  components: ComponentInfo[];
  count: number;
}

function App(): JSX.Element {
  const [code, setCode] = useState<string>(exampleCode);
  const [renderedHTML, setRenderedHTML] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [availableComponents, setAvailableComponents] = useState<
    ComponentInfo[]
  >([]);
  const previewRef = useRef<HTMLDivElement>(null);

  // Fetch available components on mount
  useEffect(() => {
    const fetchComponents = async (): Promise<void> => {
      try {
        const response = await axios.get<ComponentsResponse>(
          `${API_BASE_URL}/components`
        );
        if (response.data.success) {
          setAvailableComponents(response.data.components);
        }
      } catch (err) {
        console.warn('Failed to fetch available components:', err);
      }
    };

    fetchComponents();
  }, []);

  const handleRender = async (): Promise<void> => {
    if (!code.trim()) {
      setError('Please enter some React component code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post<RenderResponse>(
        `${API_BASE_URL}/render`,
        {
          code: code.trim(),
          props: {},
        }
      );

      if (response.data.success) {
        const html = response.data.html || '';
        setRenderedHTML(html);
      } else {
        setError(response.data.error || 'Unknown error occurred');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || 'Failed to render component'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearCode = (): void => {
    setCode('');
    setRenderedHTML('');
    setError('');
  };

  const handleLoadExample = (): void => {
    setCode(exampleCode);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            React Server-Side Rendering POC
          </h1>
          <p className="text-gray-600 text-lg">
            Enter React component code below and see it rendered on the server
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Code Editor Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Component Code
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleLoadExample}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
                >
                  Load Example
                </button>
                <button
                  onClick={handleClearCode}
                  className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-80 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your React component code here..."
              spellCheck={false}
            />

            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="text-sm text-gray-500 space-y-1">
                  <div>
                    Supports JSX, TailwindCSS classes, and basic React hooks
                  </div>
                  {availableComponents.length > 0 && (
                    <div>
                      <strong>Available components:</strong>{' '}
                      {availableComponents.map((comp, index) => (
                        <span key={comp.name}>
                          <code className="bg-gray-100 px-1 rounded text-xs">
                            &lt;{comp.name}&gt;
                          </code>
                          {index < availableComponents.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleRender}
                  disabled={loading || !code.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Rendering...' : 'Render Component'}
                </button>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Server-Rendered Output
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 font-medium mb-1">
                  Rendering Error:
                </div>
                <div className="text-red-700 text-sm font-mono whitespace-pre-wrap">
                  {error}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center h-80 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                Rendering component on server...
              </div>
            )}

            {!loading && !error && renderedHTML && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Live Preview (Complete HTML Document):
                  </div>
                  <div className="border border-gray-200 rounded p-4 bg-white">
                    <iframe
                      srcDoc={renderedHTML}
                      className="w-full h-96 border-0"
                      title="Component Preview"
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Generated HTML Source:
                  </div>
                  <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto max-h-64">
                    {renderedHTML}
                  </pre>
                </div>
              </div>
            )}

            {!loading && !error && !renderedHTML && (
              <div className="flex items-center justify-center h-80 text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">🚀</div>
                  <div>
                    Enter component code and click "Render Component" to see the
                    magic!
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            How it works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 mt-1">
                1
              </div>
              <div>
                <div className="font-medium text-gray-800">Write Component</div>
                Enter your React component code with JSX and TailwindCSS classes
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 mt-1">
                2
              </div>
              <div>
                <div className="font-medium text-gray-800">Server Renders</div>
                Code is sent to server, compiled with Babel, and rendered to
                HTML
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 mt-1">
                3
              </div>
              <div>
                <div className="font-medium text-gray-800">Preview Result</div>
                Rendered HTML is displayed with live preview and source code
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
