// Utility function to generate clean filenames from tags
export function generateFilenameFromTags(
  post: {
    id: number;
    tag_string_general?: string;
    tag_string_character?: string; 
    tag_string_copyright?: string;
    tag_string?: string;
    md5: string;
    file_ext: string;
  }
): string {
  // Try to get character tags first
  let tagSource = post.tag_string_character || '';
  let tags = tagSource.split(' ').filter(tag => tag.length > 0);

  // If no character tags, try copyright tags
  if (tags.length === 0) {
    tagSource = post.tag_string_copyright || '';
    tags = tagSource.split(' ').filter(tag => tag.length > 0);
  }
  
  // If no copyright tags, try general tags
  if (tags.length === 0) {
    tagSource = post.tag_string_general || '';
    tags = tagSource.split(' ').filter(tag => tag.length > 0);
  }
  
  // If still no tags, use all tags
  if (tags.length === 0 && post.tag_string) {
    tags = post.tag_string.split(' ').filter(tag => tag.length > 0);
  }
  
  // Take only the first 2 tags
  tags = tags.slice(0, 2);
  
  // Clean up tags to keep only alphanumeric, dashes, underscores, and brackets
  const cleanTags = tags.map(tag => {
    return tag.replace(/[^a-zA-Z0-9\-_[\]]/g, '_');
  });
  
  // If no tags are available, fall back to md5
  const tagPart = cleanTags.length > 0 ? cleanTags.join('_') : 'untagged';
  
  // Return filename in format: [id]_[tags]_[md5].[ext]
  return `${post.id}_${tagPart}_${post.md5}.${post.file_ext}`;
}
