import { resources } from "@/data/resources";
import ResourceViewer from "@/components/ResourceViewer";
import { notFound } from "next/navigation";

// Generate paths for static generation
export async function generateStaticParams() {
  return resources.map((res) => ({
    slug: res.slug,
  }));
}

// Generate dynamic SEO metadata
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = resources.find((r) => r.slug === slug);
  if (!resource) {
    return {
      title: "Resource Not Found | NextGen Academy",
      description: "This portal resource directory does not exist or has been removed."
    };
  }

  return {
    title: `${resource.title} | NextGen Academy & Consulting`,
    description: resource.description,
    openGraph: {
      title: `${resource.title} | NextGen Academy`,
      description: resource.description,
      type: "website"
    }
  };
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = resources.find((r) => r.slug === slug);
  
  if (!resource) {
    notFound();
  }

  return <ResourceViewer resource={resource} />;
}
