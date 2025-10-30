import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test Page - SSR Verification",
  description: "This is a test page to verify server-side rendering is working correctly.",
};

export default function TestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-4xl font-bold text-primary mb-4">
        SSR Test Page
      </h1>
      <p className="text-lg text-foreground mb-4">
        If you can see this content in the HTML source code, then SSR is working correctly!
      </p>
      <div className="bg-card p-6 vintage-border">
        <h2 className="text-2xl font-bold mb-4">Server-Side Rendered Content</h2>
        <p className="text-foreground mb-4">
          This content should be visible in the HTML source code when you view page source.
        </p>
        <ul className="list-disc list-inside text-foreground">
          <li>Content is rendered on the server</li>
          <li>Search engines can index this content</li>
          <li>No JavaScript required to see this text</li>
          <li>Faster initial page load</li>
        </ul>
      </div>
      <div className="mt-8 p-4 bg-muted rounded">
        <p className="text-sm text-muted-foreground">
          <strong>Current time:</strong> {new Date().toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>User Agent:</strong> Server-side rendered
        </p>
      </div>
    </div>
  );
}
