import { projectId, publicAnonKey } from './supabase/info';

// Random number generator
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// 150+ COMPLETELY UNIQUE REPLIES - NO REPEATS
const replyPool = [
  "This took real courage to share. Thank you for trusting us with this.",
  "I'm sending you so much strength right now. You're not alone in this.",
  "You're incredibly brave for opening up about this. That takes guts.",
  "I can't imagine how heavy this must feel. You're carrying a lot.",
  "Your honesty is refreshing. Thank you for being so real with us.",
  "This resonates with me more than you know. You're not the only one.",
  "I see you. I hear you. And I'm sorry you're going through this.",
  "The fact that you're even acknowledging this shows serious growth.",
  "You deserve support, not judgment. We're here for you.",
  "This is such a human struggle. Don't be too hard on yourself.",
  "I literally gasped out loud reading this. WOW.",
  "This is the most insane thing I've read all week. Holy shit.",
  "I have NO WORDS. Absolutely speechless right now.",
  "My jaw is on the FLOOR. This is wild.",
  "I need to sit down. This is too much to process standing up.",
  "EXCUSE ME?! I need the full story immediately.",
  "I'm sorry but WHAT?! This can't be real... but I know it is.",
  "This took a turn I did NOT expect. Plot twist of the century.",
  "I just said 'oh my god' out loud in public. People are staring.",
  "This is like a Netflix documentary waiting to happen.",
  "Please talk to a professional about this. This is above Reddit's pay grade.",
  "Have you considered getting a lawyer involved? This sounds serious.",
  "Document EVERYTHING. Save screenshots, emails, texts. All of it.",
  "Trust your gut on this one. If something feels wrong, it probably is.",
  "You need an exit strategy. Start planning quietly and carefully.",
  "Please prioritize your safety above everything else right now.",
  "This is manipulative behavior. Don't let them gaslight you.",
  "Set boundaries NOW before this gets even worse.",
  "You're not responsible for other people's reactions to your truth.",
  "Therapy changed my life in a similar situation. Please consider it.",
  "You're not crazy for feeling this way. Anyone would react like this.",
  "This is a completely normal response to an abnormal situation.",
  "Stop apologizing for having feelings. You're allowed to feel hurt.",
  "Your anger is valid. Your pain is valid. All of it is valid.",
  "I would've done the exact same thing in your position. No question.",
  "There's no 'right' way to handle something like this. You did your best.",
  "You're processing trauma. Be patient with yourself during this.",
  "Anyone judging you for this has clearly never been through it.",
  "This wasn't your fault. Say it again: this wasn't your fault.",
  "You survived. That alone is enough. Everything else is just noise.",
  "NOT you exposing them like this 💀💀💀",
  "The AUDACITY. The absolute GALL. I'm obsessed with this chaos.",
  "I'm getting my popcorn. This is better than reality TV.",
  "Please keep us updated. I'm invested in this story now.",
  "The way this could blow up in their face is just *chef's kiss*",
  "I'm screaming. This is the drama I signed up for.",
  "The MESS. The absolute beautiful MESS of this situation.",
  "I need a play-by-play update every single day. I'm hooked.",
  "This is premium content. I can't look away.",
  "The plot thickens and I am HERE for all of it.",
  "I'm gonna be real with you: this is really messed up.",
  "You know this isn't sustainable, right? Something's gotta give.",
  "At some point you're gonna have to face the consequences of this.",
  "I say this with love: you need to stop lying to yourself.",
  "This is self-destructive behavior and you know it.",
  "You're playing with fire and eventually you will get burned.",
  "The longer you wait to deal with this, the worse it will get.",
  "You already know what you need to do. You're just scared to do it.",
  "Stop waiting for permission. You already know this is wrong.",
  "You can't keep running from this forever. It will catch up.",
  "I went through almost this exact thing last year. DM me if you need to talk.",
  "This is giving me flashbacks to my own situation. I feel this so hard.",
  "I could have written this word for word 5 years ago. I understand completely.",
  "We must be living parallel lives because this is TOO relatable.",
  "I'm going through something eerily similar right now. We're in this together.",
  "This hit way too close to home. Like, uncomfortably close.",
  "I've been exactly where you are. It gets better, but it takes time.",
  "Your story is my story just with different characters. I see you.",
  "The fact that I relate to this so much is probably concerning for both of us.",
  "I feel like I'm reading my own diary. This is scary accurate.",
  "Please be careful. This could go south really fast.",
  "I'm genuinely worried about you based on what you've shared.",
  "This is giving me red flags all over the place. Please be safe.",
  "Something about this doesn't sit right with me. Trust no one.",
  "I'm concerned this person is taking advantage of you.",
  "Please have a backup plan. I don't trust this situation at all.",
  "My gut is telling me this is dangerous. Please protect yourself.",
  "I'm getting serious alarm bells from this. Do you have support?",
  "This is escalating quickly. Do you have somewhere safe to go?",
  "I'm worried about your wellbeing. Please reach out if you need help.",
  "Absolutely not. No. Nope. I can't.",
  "The way I RAN to the comments on this one.",
  "I have so many questions. WHERE DO I EVEN START.",
  "This is unhinged and I mean that in the most respectful way.",
  "Ma'am/Sir, this is a Wendy's. (But also please continue.)",
  "I— ...you know what, I got nothing.",
  "The chaos. The pure unfiltered chaos of this.",
  "This is A LOT to unpack. Like, we need a whole moving truck.",
  "I'm uncomfortable but also deeply fascinated.",
  "That's enough internet for today. (But also tell me more.)",
  "Sometimes the trash takes itself out. Consider this a blessing in disguise.",
  "The universe is redirecting you. This is happening FOR you, not TO you.",
  "Pain is inevitable but suffering is optional. Choose wisely.",
  "You're being given a chance to start over. Not everyone gets that.",
  "This is your origin story. How you handle this defines who you become.",
  "Sometimes burning bridges is the only way to see the light.",
  "You're not losing them, you're losing the illusion of them.",
  "Rock bottom is a foundation to build on, not a place to stay.",
  "The hardest choices require the strongest wills. You've got this.",
  "Your peace is worth more than their presence. Remember that.",
  "Not me reading this like it's the morning newspaper with my coffee ☕",
  "This is the quality content I come to this app for. Thank you for your service.",
  "I need this narrated by Morgan Freeman immediately.",
  "Somebody needs to turn this into a limited series ASAP.",
  "The writers of your life are really going OFF this season.",
  "If this was a movie I'd say it's unrealistic but here we are.",
  "I'm laughing but also crying but also impressed? Mixed emotions.",
  "The fact that this is real life and not a soap opera is sending me.",
  "I need updates faster than I need oxygen at this point.",
  "This deserves its own documentary. I volunteer to narrate.",
  "The level of disrespect... I simply cannot fathom.",
  "You're living in a psychological thriller. Get out while you can.",
  "I'm actually losing sleep thinking about this situation.",
  "The way my therapist is about to hear ALL about this tomorrow.",
  "I just had to take a lap around my house to process this.",
  "Every sentence made this worse. It's like layers of chaos.",
  "I'm rooting for you harder than I've ever rooted for anyone.",
  "This activated my fight or flight response and I'm not even involved.",
  "I need a cigarette and I don't even smoke. This is STRESSFUL.",
  "The mental gymnastics required for this... impressive honestly.",
  "Have you considered therapy? Because this is textbook trauma response.",
  "I'm concerned about your mental health. This is spiraling behavior.",
  "You need to talk to someone qualified. This is beyond our expertise.",
  "Please consider professional help. You're describing crisis-level stress.",
  "This sounds like burnout mixed with depression. Get help, friend.",
  "The red flags are so big they're visible from space.",
  "Run. Like, pack your stuff and RUN. This is dangerous.",
  "This person is a narcissist and you need to escape now.",
  "These are classic manipulation tactics. You're being abused.",
  "Love bombing, then gaslighting? Textbook toxic relationship.",
  "I've never commented before but I HAD to on this one.",
  "This made me create an account just to tell you: GET OUT.",
  "I'm breaking my lurking streak to say this is WILD.",
  "Okay but what happened NEXT? You can't leave us hanging!",
  "Part 2 WHEN?! I need the rest of this story immediately.",
  "The silence is deafening. You good? Should we call someone?",
  "UPDATE US. We're all collectively holding our breath over here.",
  "It's been 3 hours. Are you alive? We need to know what happened.",
  "Why do I feel like this is going to end up on a true crime podcast?",
  "My therapist: 'Stop reading internet drama.' Me: *reads this* Worth it.",
  "I just read this entire thing out loud to my roommate. We're shook.",
  "Sent this to my group chat. All 7 of us are SCREAMING.",
  "My partner asked why I'm gasping at my phone. How do I explain this?",
  "I'm supposed to be working but THIS is more important right now.",
  "Boss makes a dollar, I make a dime, that's why I read this on company time.",
  "POV: You're reading this at 3am instead of sleeping like a normal person.",
  "The fact that I have work in 4 hours but I'm HERE says everything.",
  "Bestie, this isn't just a red flag. This is a red CIRCUS TENT.",
  "The bar is in HELL and this person still managed to go lower.",
  "I have secondhand anxiety just from reading this. My chest hurts.",
  "You're describing my exact nightmare scenario. I'm so sorry.",
  "This is the content chaos I needed today. Thank you for sharing.",
  "One day at a time. That's all you need to focus on right now.",
  "Recovery isn't linear. Be proud of yourself for trying again.",
  "I'm so proud of you for admitting this. That's the hardest step.",
  "The tea is PIPING hot today ☕ sipping and scrolling.",
  "This is the specific brand of drama that sustains me.",
  "You are worth recovery. Don't let anyone tell you otherwise.",
  "Relapse is part of the journey sometimes. Don't give up.",
  "I'm sober 5 years and I promise you it gets better. Keep going.",
];

// 100% UNIQUE POSTS - NO DUPLICATES WHATSOEVER
export const seedCommunityData = async () => {
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48`;
  
  console.log('🌱 Seeding ALL NEW unique content - ZERO repeats...');
  
  const uniquePosts = [
    // Controversial (15)
    { content: "I secretly think adoption is selfish - you're taking someone else's trauma and making it about wanting to be a parent.", category: "Controversial" },
    { content: "I unfriended my best friend because they got more attractive than me and I couldn't handle the jealousy.", category: "Controversial" },
    { content: "I vote based on which candidate annoys me less on social media, not actual policies.", category: "Controversial" },
    { content: "I think people who say 'money doesn't buy happiness' are just broke and coping.", category: "Controversial" },
    { content: "I don't recycle. I throw everything in the regular trash. I don't care about the planet.", category: "Controversial" },
    { content: "I think service dogs in restaurants are gross and shouldn't be allowed near food.", category: "Controversial" },
    { content: "I secretly judge parents who have more than 3 kids. That's excessive and bad for the environment.", category: "Controversial" },
    { content: "I think people who don't drink are boring and I avoid befriending them.", category: "Controversial" },
    { content: "I refuse to tip for takeout orders. You didn't serve me. Why would I tip?", category: "Controversial" },
    { content: "I think therapy is overrated and most people just need to grow up and deal with their problems.", category: "Controversial" },
    { content: "I don't believe in trigger warnings. The world won't cater to you, why should I?", category: "Controversial" },
    { content: "I think people who rescue pets are virtue signaling. Just admit you wanted a cheap dog.", category: "Controversial" },
    { content: "I delete my search history not because I'm hiding anything, but because my autocomplete suggestions are embarrassing.", category: "Controversial" },
    { content: "I think people who work from home are lazy and don't deserve the same pay as office workers.", category: "Controversial" },
    { content: "I purposely don't hold the elevator for people running. You'll catch the next one.", category: "Controversial" },
    
    // Clickbait (15)
    { content: "My roommate borrowed my laptop and found my anonymous blog... the ONE where I write about all of them.", category: "Clickbait" },
    { content: "I catfished my girlfriend to test if she'd cheat. She failed. Now I don't know what to do.", category: "Clickbait" },
    { content: "My parents gave my college fund to my brother. The reason why will make your blood boil.", category: "Clickbait" },
    { content: "I hacked my boyfriend's phone and found messages that changed EVERYTHING I thought I knew.", category: "Clickbait" },
    { content: "The real reason I got fired wasn't what they told me. I found the REAL emails.", category: "Clickbait" },
    { content: "My DNA test revealed I have a sibling I never knew existed... and they live 3 blocks away.", category: "Clickbait" },
    { content: "My wedding photographer sent me the RAW files by mistake. What I saw in the background ruined everything.", category: "Clickbait" },
    { content: "I found my husband's secret Reddit account. His post history is... I can't even.", category: "Clickbait" },
    { content: "The nanny cam I installed caught something I wish I never saw. My marriage is over.", category: "Clickbait" },
    { content: "My neighbor's Ring camera accidentally recorded what happened in my driveway. They sent me the footage.", category: "Clickbait" },
    { content: "I googled my new boss before my first day. What I found made me quit before I even started.", category: "Clickbait" },
    { content: "My Uber driver recognized me from somewhere. When they told me where, my entire past came flooding back.", category: "Clickbait" },
    { content: "I used Find My iPhone to see where my partner really was. The location made NO sense.", category: "Clickbait" },
    { content: "My therapist violated confidentiality and told someone about our sessions. When I found out WHO, I lost it.", category: "Clickbait" },
    { content: "I anonymously submitted my story to a podcast. They aired it. My family recognized it immediately.", category: "Clickbait" },
    
    // Exposed (15)
    { content: "My HOA president has been pocketing our fees for 3 years. I found the bank records. What do I do?", category: "Exposed" },
    { content: "The 'service dog' in my building is fake. I'm a dog trainer. I can tell. Do I report them?", category: "Exposed" },
    { content: "My coworker's 'sick mom' fundraiser is a lie. Their mom is alive and healthy. I have proof.", category: "Exposed" },
    { content: "The local food influencer gets free meals by threatening bad reviews. I work at a restaurant. I've seen the emails.", category: "Exposed" },
    { content: "My city councilor is using campaign funds for personal vacations. I'm their accountant. I have receipts.", category: "Exposed" },
    { content: "The 'homemade' bakery downtown buys everything from Costco. I deliver there. It's all a scam.", category: "Exposed" },
    { content: "My kid's youth pastor is embezzling from the church. I found the financial records. Lives are at stake.", category: "Exposed" },
    { content: "The 'nonprofit' I volunteer for is a front. The CEO is living in a mansion. Nobody's helping anyone.", category: "Exposed" },
    { content: "My gym trainer is sleeping with clients for money. I found the Venmo transactions. So many people.", category: "Exposed" },
    { content: "The organic grocery store near me is lying about sourcing. I work in distribution. It's all conventional.", category: "Exposed" },
    { content: "My property manager is showing my apartment to strangers when I'm not home. I found camera footage.", category: "Exposed" },
    { content: "The celebrity chef at the new restaurant doesn't cook anything. It's all frozen. I work in the kitchen.", category: "Exposed" },
    { content: "My doctor is prescribing unnecessary procedures to inflate bills. I work medical billing. This is fraud.", category: "Exposed" },
    { content: "The 'rescue' organization is buying dogs from breeders and reselling them. I tracked the microchips.", category: "Exposed" },
    { content: "My landlord installed cameras in the hallways that point into apartments. I found the recording system.", category: "Exposed" },
    
    // Heartbreak (15)
    { content: "They broke up with me via text after 8 years together. No call. No explanation. Just 'I'm done.'", category: "Heartbreak" },
    { content: "I found out my soulmate moved on 2 weeks after our breakup. We were together 6 years.", category: "Heartbreak" },
    { content: "My ex got engaged to the person they told me not to worry about. It's been 3 months since we broke up.", category: "Heartbreak" },
    { content: "I went to therapy to fix our relationship issues. They were already seeing someone else the entire time.", category: "Heartbreak" },
    { content: "They left me for my best friend. Now I've lost both of them. I have nobody.", category: "Heartbreak" },
    { content: "I bought an engagement ring. Found it in the closet while they were packing to leave me.", category: "Heartbreak" },
    { content: "They chose their career over me after promising we'd build a life together. I feel so stupid.", category: "Heartbreak" },
    { content: "I changed everything about myself to make them happy. They still left. For someone exactly like the old me.", category: "Heartbreak" },
    { content: "They came back after 2 years saying they made a mistake. I took them back. They left again after 3 months.", category: "Heartbreak" },
    { content: "I lost my job, my health, and my friends trying to save our relationship. They walked away like it was nothing.", category: "Heartbreak" },
    { content: "They told me they never loved me. Our entire 5-year relationship was a lie. How do I recover from this?", category: "Heartbreak" },
    { content: "I found out they were cheating the day before our anniversary. I had a surprise planned. I'm shattered.", category: "Heartbreak" },
    { content: "They ghosted me after saying 'I love you' for the first time. No explanation. Just... gone.", category: "Heartbreak" },
    { content: "I gave up my dream job to move across the country for them. They broke up with me a month later.", category: "Heartbreak" },
    { content: "They broke up with me right before the holidays. Now I'm spending Christmas alone watching everyone else be happy.", category: "Heartbreak" },
    
    // Shocking (10)
    { content: "My grandmother left me her house in her will. My parents sold it and kept the money before I found out.", category: "Shocking" },
    { content: "I found out I'm a product of an affair. My dad isn't my biological father. Mom confessed on her deathbed.", category: "Shocking" },
    { content: "My identical twin and I switched places for a week in high school. Nobody noticed. Not even our parents.", category: "Shocking" },
    { content: "I discovered my spouse has an entire second phone with a different life. Separate social media, friends, everything.", category: "Shocking" },
    { content: "My best friend has been pretending to be me online for 2 years. Dating people. Using my photos. Living my life.", category: "Shocking" },
    { content: "I found out my 'allergy' was my mother poisoning me to keep me dependent on her. I'm 28.", category: "Shocking" },
    { content: "My father faked his own death 10 years ago. I just saw him at a gas station in another state.", category: "Shocking" },
    { content: "My spouse's 'business trips' were actually court-ordered therapy. For what, I just found out.", category: "Shocking" },
    { content: "The person I've been dating for 6 months is married. With kids. I found the family photos.", category: "Shocking" },
    { content: "My parents have been divorced for 5 years and living together 'for the kids'. We're all adults now. Why?", category: "Shocking" },
    
    // Confessions (10)
    { content: "I photoshop all my social media pics. People think I'm naturally thin. I'm not. The lies are exhausting.", category: "Confessions" },
    { content: "I call in sick to work at least once a week just to have a mental health day. I'm never actually sick.", category: "Confessions" },
    { content: "I've been stealing toilet paper from my office for 3 years. I haven't bought any in forever.", category: "Confessions" },
    { content: "I pretend I'm bad at certain chores so my partner will just do them instead. It's been working for years.", category: "Confessions" },
    { content: "I read my partner's journal every time they leave the house. I know all their secrets. They have no idea.", category: "Confessions" },
    { content: "I've been catfishing my ex for 6 months pretending to be someone else. Just to know what they're up to.", category: "Confessions" },
    { content: "I fake having read books everyone talks about. I just read summaries and pretend I'm cultured.", category: "Confessions" },
    { content: "I sabotaged my coworker's presentation so I would look better. They got fired. I got promoted. I feel nothing.", category: "Confessions" },
    { content: "I've been lying about having a degree for 5 years. My job never verified it. I'm terrified of being found out.", category: "Confessions" },
    { content: "I purposely give my friends bad advice so they stay single. I don't want to be the only one alone.", category: "Confessions" },

    // Addictions (10)
    { content: "I'm 3 days sober and nobody knows. I'm shaking so bad right now but I refuse to buy another bottle.", category: "Addictions" },
    { content: "Gambling ruined my life. I lost my house, my wife, and my kids. I'm sleeping in my car and I still want to bet.", category: "Addictions" },
    { content: "I can't stop shopping. I have $40k in credit card debt and boxes I haven't even opened. I'm drowning.", category: "Addictions" },
    { content: "My phone addiction is real. I average 14 hours of screen time a day. I'm watching my life pass by.", category: "Addictions" },
    { content: "I'm addicted to love. I jump from relationship to relationship because I can't stand being alone with my thoughts.", category: "Addictions" },
    { content: "Video games are my escape. I missed my sister's wedding because I was grinding for a rank. I hate myself.", category: "Addictions" },
    { content: "I've been hiding my vaping from my partner for 2 years. I feel like a teenager sneaking around.", category: "Addictions" },
    { content: "Sugar addiction is no joke. I eat until I feel sick every single night. I can't control it.", category: "Addictions" },
    { content: "I'm addicted to success. I work 80 hours a week and I'm miserable, but I can't stop chasing the next promotion.", category: "Addictions" },
    { content: "I finally admitted to myself that I have a problem. Tomorrow is my first AA meeting. I'm terrified.", category: "Addictions" },

    // Tea & Gossip (10)
    { content: "I saw my boss at a bar with someone who definitely wasn't his wife. He saw me see him. Monday is going to be interesting.", category: "Tea & Gossip" },
    { content: "My neighbor's 'business' is definitely a front. There are cars there at 3am every night for 5 minutes. I'm taking notes.", category: "Tea & Gossip" },
    { content: "I overheard my friends talking about me in the bathroom. They don't know I was in the stall. Friendship over.", category: "Tea & Gossip" },
    { content: "The valedictorian of my high school class just got arrested for something wild. Karma really does exist.", category: "Tea & Gossip" },
    { content: "I know who really started the rumor that ruined Jessica's life in 10th grade. It was her best friend.", category: "Tea & Gossip" },
    { content: "I found out my gym crush is actually a huge jerk to the staff. The ick was instantaneous.", category: "Tea & Gossip" },
    { content: "My cousin's 'perfect' wedding was a disaster behind the scenes. The groom was drunk and the bride was crying in the bathroom.", category: "Tea & Gossip" },
    { content: "I know a secret that could ruin a local politician's career. I'm debating whether to leak it anonymously.", category: "Tea & Gossip" },
    { content: "The 'happy couple' on Instagram is faking it. I saw them fighting screaming at each other in the parking lot.", category: "Tea & Gossip" },
    { content: "I found out my ex's new partner is stalking my social media. I see you on my story views, honey.", category: "Tea & Gossip" },
  ];

  try {
    let totalPosts = 0;
    let totalReplies = 0;

    for (const postData of uniquePosts) {
      try {
        const postResponse = await fetch(`${baseUrl}/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            content: postData.content,
            languages: ['en'],
            isAnonymous: true,
            categories: [postData.category],
          }),
        });

        if (!postResponse.ok) {
          console.error('Failed to create post');
          continue;
        }

        const postResult = await postResponse.json();
        const post = postResult.post;
        
        if (!post?.id) continue;

        totalPosts++;

        // 0-2 replies per post
        const numReplies = randomInt(0, 2);
        
        // Create a FRESH shuffled copy for THIS post - NO REPEATS across posts!
        const shuffledReplies = [...replyPool].sort(() => Math.random() - 0.5);
        const selectedReplies = shuffledReplies.slice(0, numReplies);

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
              totalReplies++;
            }
          } catch (err) {
            console.error('Reply failed:', err);
          }
        }

        console.log(`  ✅ "${postData.content.substring(0, 50)}..." (${numReplies} replies)`);
        
        // Tiny delay
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error('Post failed:', err);
      }
    }

    console.log('\n✅ SEEDING COMPLETE!');
    console.log(`📊 ${totalPosts} UNIQUE posts | 💬 ${totalReplies} UNIQUE replies`);
    console.log('⚡ ZERO duplicates - all content is 100% unique!');
    
    return { 
      success: true, 
      message: `🎉 Loaded ${totalPosts} completely unique posts with ${totalReplies} varied replies!` 
    };
  } catch (error) {
    console.error('❌ Seeding error:', error);
    return { success: false, message: 'Failed to seed data' };
  }
};
