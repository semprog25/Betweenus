import { projectId, publicAnonKey } from './supabase/info';

/**
 * Migrate old posts to add language tags and categories
 */
export const migrateOldPosts = async () => {
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48`;
  
  try {
    console.log('🔄 Starting migration of old posts...');
    
    // Fetch all posts
    const response = await fetch(`${baseUrl}/posts?language=all`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    const data = await response.json();
    const posts = data.posts || [];
    
    console.log(`Found ${posts.length} posts to check for migration`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Update each post
    for (const post of posts) {
      // Check if post already has language and categories
      const needsLanguage = !post.languages || post.languages.length === 0;
      const needsCategories = !post.categories || post.categories.length === 0;
      
      if (!needsLanguage && !needsCategories) {
        console.log(`✓ Skipping post ${post.id} - already has tags`);
        skippedCount++;
        continue;
      }

      // Infer categories from content
      const categories = inferCategoriesFromContent(post.content);
      
      const updateData = {
        languages: needsLanguage ? ['en'] : post.languages,
        categories: needsCategories ? categories : post.categories,
      };

      console.log(`Updating post ${post.id} with:`, updateData);

      // Call update endpoint
      const updateResponse = await fetch(`${baseUrl}/posts/${post.id}/metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(updateData),
      });

      if (updateResponse.ok) {
        console.log(`✅ Updated post ${post.id}`);
        updatedCount++;
      } else {
        const errorText = await updateResponse.text();
        console.error(`❌ Failed to update post ${post.id}:`, errorText);
        errorCount++;
      }

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const message = `Migration complete! ✅ Updated: ${updatedCount}, ⏭️ Skipped: ${skippedCount}${errorCount > 0 ? `, ❌ Errors: ${errorCount}` : ''}`;
    console.log(message);
    return { success: true, updated: updatedCount, skipped: skippedCount, errors: errorCount, message };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Infer categories from post content using keywords
 */
function inferCategoriesFromContent(content: string): string[] {
  const lowerContent = content.toLowerCase();
  const categories: string[] = [];

  // Relationship keywords
  if (/(affair|relationship|partner|spouse|boyfriend|girlfriend|married|dating|love|cheating)/i.test(lowerContent)) {
    categories.push('Relationships');
  }

  // Mental Health keywords
  if (/(depression|anxiety|suicidal|mental health|therapist|therapy|burnout|stress|panic)/i.test(lowerContent)) {
    categories.push('Mental Health');
  }

  // Family keywords
  if (/(child|parent|mom|dad|family|sibling|brother|sister|kid|son|daughter)/i.test(lowerContent)) {
    categories.push('Family');
  }

  // Career keywords
  if (/(job|work|career|boss|employee|company|office|colleague|qualification|medical school|teacher|nurse|politician)/i.test(lowerContent)) {
    categories.push('Career');
  }

  // Controversial keywords
  if (/(secret|guilt|lying|steal|fraud|fake|embezzl|cheat|illegal|wrong)/i.test(lowerContent)) {
    categories.push('Controversial');
  }

  // Default category if none matched
  if (categories.length === 0) {
    categories.push('General');
  }

  return categories;
}