"use client";

import React, { useEffect, useState } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { LearnResource } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Custom component to handle video embeds from a simple "VIDEO: url" syntax
const VideoEmbed = ({ url }: { url: string }) => {
  const youtubeEmbedUrl = url.includes("youtube.com/watch?v=")
    ? url.replace("watch?v=", "embed/")
    : url.includes("youtu.be/")
    ? `https://www.youtube.com/embed/${url.split("youtu.be/")[1]}`
    : url;

  return (
    <div className="not-prose my-6 aspect-video rounded-lg overflow-hidden shadow-lg">
      <iframe
        src={youtubeEmbedUrl}
        title="Embedded Video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
};

export default function LearnDetailPage() {
  const { t, language } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [resource, setResource] = useState<LearnResource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchResource = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "learn_resources", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setResource({ id: docSnap.id, ...docSnap.data() } as LearnResource);
        } else {
          notFound();
        }
      } catch (error) {
        console.error("Error fetching resource:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };
    fetchResource();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!resource) {
    notFound();
  }

  const title = language === "mn" ? resource.title_mn : resource.title_en;
  const content = language === "mn" ? resource.content_mn : resource.content_en;

  // Custom renderer to find "VIDEO: url" lines and replace them with the VideoEmbed component
  const renderers = {
    p: ({ node, ...props }: any) => {
      if (
        node.children.length === 1 &&
        node.children[0].type === "text" &&
        node.children[0].value.startsWith("VIDEO: ")
      ) {
        const url = node.children[0].value.substring(7).trim();
        return <VideoEmbed url={url} />;
      }
      return <p {...props} />;
    },
    a: (props: any) => (
      <a {...props} target="_blank" rel="noopener noreferrer" />
    ),
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" /> {t("buttons.goBack")}
      </Button>

      <article>
        <header className="mb-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
            <Badge variant="outline" className="text-xs font-medium">
              {t(`learnCenter.types.${resource.type}`)}
            </Badge>
            {resource.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground leading-tight">
            {title}
          </h1>
        </header>

        <Image
          src={resource.imageUrl}
          alt={title}
          width={1200}
          height={600}
          className="w-full h-auto object-cover rounded-xl shadow-lg mb-8"
          data-ai-hint="learning career development"
          priority
        />

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
            {content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
