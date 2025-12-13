import { projectId, publicAnonKey } from './supabase/info';

// Helper to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 100+ UNIQUE FRESH REPLIES - Different from seed data
const newReplyPool = [
  "I felt this in my soul. You're not alone in this struggle.",
  "This is the kind of raw honesty we need more of. Thank you.",
  "The way you explained this just clicked something for me. Wow.",
  "I'm saving this post because I know I'll need to come back to it.",
  "You've put into words what I couldn't express for years.",
  "This deserves way more attention than it's getting.",
  "I'm literally crying reading this. It's so relatable it hurts.",
  "You're stronger than you think. This post proves it.",
  "The courage it took to share this... massive respect.",
  "I hope you're doing okay. Sending all the positive vibes your way.",
  "This is therapeutic just to read. Thank you for sharing.",
  "Everyone needs to read this. It's so important.",
  "Your vulnerability here is incredibly powerful.",
  "I'm going through the exact same thing right now. This helps.",
  "The honesty in this post is refreshing and needed.",
  "This made me realize I'm not broken. Thank you.",
  "Saving this to show my therapist. This is exactly what I've been trying to say.",
  "The fact that you're still here fighting says everything.",
  "This is the reality check I needed today.",
  "Your story matters. Your experience is valid. Don't forget that.",
  "I wish I could give you a hug through the screen.",
  "This hit different. I needed to hear this today.",
  "You're not being dramatic. Your feelings are completely valid.",
  "The self-awareness in this post is incredible.",
  "This is exactly why I come to this community. Real talk.",
  "I'm rooting for you so hard. You've got this.",
  "Your honesty just gave me permission to be honest too.",
  "This post is a whole mood and I'm here for it.",
  "The way you broke this down... chef's kiss. Perfect.",
  "I screenshot this to read when I'm feeling alone.",
  "Your perspective just shifted my entire mindset.",
  "This is the kind of content that actually helps people.",
  "I feel seen by this post and I didn't even write it.",
  "The emotional intelligence here is off the charts.",
  "You articulated this better than I ever could.",
  "This is going to help so many people. Thank you for being brave.",
  "I'm not crying, you're crying. (Okay I'm crying.)",
  "Your journey is inspiring even if you don't see it yet.",
  "This needs to be pinned. Everyone should read this.",
  "The growth you've shown is remarkable. Keep going.",
  "I come back to this post whenever I need perspective.",
  "Your words just validated my entire experience.",
  "This is the representation we need in these spaces.",
  "The authenticity here is unmatched. Thank you.",
  "I feel less alone after reading this. That's powerful.",
  "Your strength is showing even when you feel weak.",
  "This post just became my comfort post.",
  "The way you handled this situation is admirable.",
  "I'm learning so much from your perspective.",
  "Your self-reflection here is truly impressive.",
  "This is the kind of support everyone deserves.",
  "I'm bookmarking this for the tough days ahead.",
  "Your resilience is showing through every word.",
  "This post is a masterclass in vulnerability.",
  "I appreciate how real you're being right now.",
  "Your truth is powerful. Don't ever minimize it.",
  "This perfectly captures what so many of us feel.",
  "I'm grateful you trusted us with this story.",
  "The healing journey you're on is beautiful.",
  "Your words are going to reach someone who desperately needs them.",
  "This is the encouragement I didn't know I needed.",
  "The empathy in this community is why I stay.",
  "Your experience is a testament to your strength.",
  "I feel honored to witness your growth through this post.",
  "This is exactly what someone needs to hear today.",
  "Your perspective is so valuable. Thank you for sharing.",
  "The vulnerability here is both brave and necessary.",
  "I'm taking notes. This is wisdom right here.",
  "Your story is proof that healing is possible.",
  "This post is going to change someone's life.",
  "The authenticity in your words is palpable.",
  "I'm celebrating your courage with you today.",
  "Your honesty is a gift to this community.",
  "This is the content that makes a difference.",
  "I'm learning what I need from reading your experience.",
  "Your voice matters more than you know.",
  "This post deserves all the recognition.",
  "The emotional depth here is incredible.",
  "I'm grateful for your willingness to be vulnerable.",
  "Your journey is inspiring others. Never doubt that.",
  "This is the kind of post I come here for.",
  "Your strength shines through even in struggle.",
  "I feel connected to you through this shared experience.",
  "This perfectly articulates what I've been feeling.",
  "Your courage is contagious. Thank you.",
  "The healing you're doing is evident.",
  "This post is a beacon for others going through the same thing.",
  "Your self-awareness is truly remarkable.",
  "I'm moved by how honest you're being.",
  "This is the support we all need and deserve.",
  "Your words are resonating with so many people.",
  "The empathy you're showing yourself is beautiful.",
  "This post is a reminder that we're not alone.",
  "Your perspective just shifted my understanding.",
  "I'm in awe of your strength and vulnerability.",
  "This is the kind of healing content we need.",
  "Your story matters and I'm glad you shared it.",
  "The growth you're showing is inspirational.",
  "This post is going to help more people than you realize.",
  "Your authenticity is refreshing and needed.",
  "I'm cheering you on from here. You've got this.",
  "This is exactly what I needed to read right now.",
  "Your journey is proof that change is possible.",
  "The courage in this post is undeniable.",
];

// Add 1-3 new replies to each post in the Community
export async function addMoreRepliesToPosts() {
  try {
    const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48`;
    
    console.log('💬 Fetching posts to add more replies...');
    
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
      return { success: false, error: 'No posts found' };
    }

    console.log(`📊 Found ${posts.length} posts. Adding 1-3 new replies to each...`);
    let totalRepliesAdded = 0;
    let errorCount = 0;

    // Process posts in batches to avoid overwhelming the server
    const BATCH_SIZE = 3; // Process 3 posts at a time
    const BATCH_DELAY = 800; // Wait 800ms between batches
    const REPLY_DELAY = 200; // Wait 200ms between replies

    for (let i = 0; i < posts.length; i += BATCH_SIZE) {
      const batch = posts.slice(i, i + BATCH_SIZE);
      console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(posts.length / BATCH_SIZE)}...`);
      
      // Process each post in the batch
      await Promise.all(batch.map(async (post: any) => {
        try {
          // Randomly decide how many replies to add (1-3)
          const numRepliesToAdd = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
          
          // Shuffle and select unique replies
          const shuffledReplies = [...newReplyPool].sort(() => Math.random() - 0.5);
          const selectedReplies = shuffledReplies.slice(0, numRepliesToAdd);

          console.log(`  📝 Adding ${numRepliesToAdd} replies to post ${post.id.substring(0, 8)}...`);

          // Add each reply with a delay
          for (const replyContent of selectedReplies) {
            try {
              const replyResponse = await fetch(`${baseUrl}/posts/${post.id}/reply`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${publicAnonKey}`,
                },
                body: JSON.stringify({
                  content: replyContent,
                  isAnonymous: true,
                }),
              });

              if (replyResponse.ok) {
                totalRepliesAdded++;
                console.log(`    ✅ Reply added!`);
              } else {
                console.error(`    ❌ Failed to add reply`);
                errorCount++;
              }

              // Small delay between replies
              await delay(REPLY_DELAY);
            } catch (error) {
              console.error(`    ❌ Error adding reply:`, error);
              errorCount++;
            }
          }
        } catch (error) {
          console.error('❌ Error processing post:', error);
          errorCount++;
        }
      }));

      // Wait before processing next batch
      if (i + BATCH_SIZE < posts.length) {
        console.log(`⏳ Waiting ${BATCH_DELAY}ms before next batch...\n`);
        await delay(BATCH_DELAY);
      }
    }

    console.log(`\n✅ COMPLETED!`);
    console.log(`💬 Total new replies added: ${totalRepliesAdded}`);
    console.log(`❌ Errors: ${errorCount}`);

    return {
      success: true,
      message: `🎉 Added ${totalRepliesAdded} new replies across all posts! ${errorCount > 0 ? `(${errorCount} errors)` : ''}`,
      totalRepliesAdded,
      errorCount,
    };
  } catch (error) {
    console.error('❌ Error in addMoreRepliesToPosts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
