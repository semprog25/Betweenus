import { projectId, publicAnonKey } from './supabase/info';

// Helper to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add random upvotes and downvotes to all posts AND replies (up to 550 total votes)
export async function addVotesToPosts() {
  try {
    const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48`;
    
    // Fetch all posts
    const response = await fetch(`${baseUrl}/posts?language=all`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to fetch posts' };
    }

    const data = await response.json();
    const posts = data.posts || [];

    if (posts.length === 0) {
      return { success: false, error: 'No posts found to add votes to' };
    }

    console.log(`📊 Adding votes to ${posts.length} posts...`);
    let updatedPostCount = 0;
    let updatedReplyCount = 0;
    let errorCount = 0;

    // Process posts in batches with delays to avoid overwhelming server
    const BATCH_SIZE = 5; // Process 5 posts at a time
    const BATCH_DELAY = 500; // Wait 500ms between batches

    for (let i = 0; i < posts.length; i += BATCH_SIZE) {
      const batch = posts.slice(i, i + BATCH_SIZE);
      console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(posts.length / BATCH_SIZE)}...`);
      
      // Process each post in the batch
      await Promise.all(batch.map(async (post: any) => {
        try {
          // Generate random upvotes and downvotes for POST
          const totalVotes = Math.floor(Math.random() * 550) + 10; // 10-550 votes
          
          // Determine post type based on random distribution
          const rand = Math.random();
          let upvotes, downvotes;
          
          if (rand < 0.3) {
            // 30% Popular posts (mostly upvotes)
            upvotes = Math.floor(totalVotes * (0.7 + Math.random() * 0.25)); // 70-95% upvotes
            downvotes = totalVotes - upvotes;
          } else if (rand < 0.5) {
            // 20% Controversial posts (split votes)
            upvotes = Math.floor(totalVotes * (0.4 + Math.random() * 0.2)); // 40-60% upvotes
            downvotes = totalVotes - upvotes;
          } else if (rand < 0.65) {
            // 15% Unpopular posts (mostly downvotes)
            downvotes = Math.floor(totalVotes * (0.6 + Math.random() * 0.25)); // 60-85% downvotes
            upvotes = totalVotes - downvotes;
          } else {
            // 35% Mixed engagement
            upvotes = Math.floor(totalVotes * Math.random());
            downvotes = totalVotes - upvotes;
          }

          // Generate fake user IDs for post votes
          const upvotedBy = Array.from({ length: upvotes }, (_, i) => 
            `random-user-${post.id}-up-${i}`
          );
          const downvotedBy = Array.from({ length: downvotes }, (_, i) => 
            `random-user-${post.id}-down-${i}`
          );

          // Update the post with new votes
          try {
            const updateResponse = await fetch(`${baseUrl}/community/posts/${post.id}/update-votes`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({
                upvotes,
                downvotes,
                upvotedBy,
                downvotedBy,
              }),
            });

            if (updateResponse.ok) {
              updatedPostCount++;
              console.log(`✅ Post ${post.id}: ${upvotes} ↑ | ${downvotes} ↓`);
            } else {
              console.error(`❌ Failed to update post ${post.id}`);
              errorCount++;
            }
          } catch (error) {
            console.error(`❌ Error updating post ${post.id}:`, error);
            errorCount++;
          }

          // Add votes to each REPLY (with small delay between replies)
          if (post.replies && post.replies.length > 0) {
            for (const reply of post.replies) {
              // Generate random votes for reply (smaller scale, 5-150)
              const replyTotalVotes = Math.floor(Math.random() * 145) + 5; // 5-150 votes
              const replyRand = Math.random();
              let replyUpvotes, replyDownvotes;
              
              if (replyRand < 0.4) {
                // 40% Helpful replies (mostly upvotes)
                replyUpvotes = Math.floor(replyTotalVotes * (0.75 + Math.random() * 0.2)); // 75-95% upvotes
                replyDownvotes = replyTotalVotes - replyUpvotes;
              } else if (replyRand < 0.6) {
                // 20% Controversial replies
                replyUpvotes = Math.floor(replyTotalVotes * (0.4 + Math.random() * 0.2)); // 40-60% upvotes
                replyDownvotes = replyTotalVotes - replyUpvotes;
              } else if (replyRand < 0.75) {
                // 15% Unhelpful replies
                replyDownvotes = Math.floor(replyTotalVotes * (0.6 + Math.random() * 0.25)); // 60-85% downvotes
                replyUpvotes = replyTotalVotes - replyDownvotes;
              } else {
                // 25% Mixed engagement
                replyUpvotes = Math.floor(replyTotalVotes * Math.random());
                replyDownvotes = replyTotalVotes - replyUpvotes;
              }

              // Generate fake user IDs for reply votes
              const replyUpvotedBy = Array.from({ length: replyUpvotes }, (_, i) => 
                `random-user-${reply.id}-up-${i}`
              );
              const replyDownvotedBy = Array.from({ length: replyDownvotes }, (_, i) => 
                `random-user-${reply.id}-down-${i}`
              );

              // Update the reply with new votes
              try {
                const updateReplyResponse = await fetch(`${baseUrl}/community/posts/${post.id}/replies/${reply.id}/update-votes`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${publicAnonKey}`,
                  },
                  body: JSON.stringify({
                    upvotes: replyUpvotes,
                    downvotes: replyDownvotes,
                    upvotedBy: replyUpvotedBy,
                    downvotedBy: replyDownvotedBy,
                  }),
                });

                if (updateReplyResponse.ok) {
                  updatedReplyCount++;
                } else {
                  errorCount++;
                }
              } catch (error) {
                console.error(`❌ Error updating reply ${reply.id}:`, error);
                errorCount++;
              }

              // Small delay between reply updates
              await delay(50);
            }
          }
        } catch (error) {
          console.error('❌ Error processing post:', error);
          errorCount++;
        }
      }));

      // Wait before processing next batch
      if (i + BATCH_SIZE < posts.length) {
        console.log(`⏳ Waiting ${BATCH_DELAY}ms before next batch...`);
        await delay(BATCH_DELAY);
      }
    }

    console.log(`\n✅ COMPLETED!`);
    console.log(`📊 Posts updated: ${updatedPostCount}`);
    console.log(`💬 Replies updated: ${updatedReplyCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    return {
      success: true,
      message: `🎉 Added votes to ${updatedPostCount} posts & ${updatedReplyCount} replies! ${errorCount > 0 ? `(${errorCount} errors)` : ''}`,
      updatedPostCount,
      updatedReplyCount,
      errorCount,
    };
  } catch (error) {
    console.error('❌ Error in addVotesToPosts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
