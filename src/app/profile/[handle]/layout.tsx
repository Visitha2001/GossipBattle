import { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const handle = (await params).handle;
  
  // optionally fetch data here to get the actual user's name or bio
  // const user = await fetchUser(handle);

  return {
    title: `@${decodeURIComponent(handle)}'s Profile`,
    description: `Check out @${decodeURIComponent(handle)}'s profile, posts, and battles on GossipBattle.`,
    openGraph: {
      title: `@${decodeURIComponent(handle)} | GossipBattle`,
      description: `Check out @${decodeURIComponent(handle)}'s profile, posts, and battles on GossipBattle.`,
      url: `https://gossipbattle.com/profile/${handle}`,
      siteName: "GossipBattle",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `@${decodeURIComponent(handle)} | GossipBattle`,
      description: `Check out @${decodeURIComponent(handle)}'s profile, posts, and battles on GossipBattle.`,
    },
  };
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
