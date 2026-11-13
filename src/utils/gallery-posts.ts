interface Post { id: string; filePath?: string; data: { title: string; draft?: boolean } }
const idFromPath = (value: string) => value.replace(/^.*?src\/content\/posts\//, "").replace(/\.(md|mdx)$/i, "");

/** Preserve picker order; aliases/repeats produce one link; drafts never link. */
export function relatedGalleryPosts(references: string[], posts: Post[]) {
  const seen = new Set<string>();
  return references.flatMap((reference) => {
    const id = idFromPath(reference);
    const post = posts.find((post) => !post.data.draft && (post.id === id || (post.filePath && idFromPath(post.filePath) === id)));
    if (!post || seen.has(post.id)) return [];
    seen.add(post.id);
    return [{ title: post.data.title, url: `/posts/${post.id}/` }];
  });
}
