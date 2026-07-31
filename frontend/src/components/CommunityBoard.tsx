'use client';

import { CommunityPost } from '../types';
import { HeartIcon } from './icons/PetIcons';

interface CommunityBoardProps {
  posts: CommunityPost[];
  newPostText: string;
  setNewPostText: (val: string) => void;
  onSubmitPost: (e: React.FormEvent) => void;
  onLikePost: (id: number) => void;
}

export default function CommunityBoard({
  posts,
  newPostText,
  setNewPostText,
  onSubmitPost,
  onLikePost
}: CommunityBoardProps) {
  return (
    <main className="w-full max-w-4xl mx-auto bg-warmCard border border-warmBeige rounded-3xl p-6 md:p-10 shadow-sm flex flex-col gap-6 transition-all duration-300">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal">Community Board</h1>
        <p className="text-xs md:text-sm text-stone-500 font-medium mt-1">Connect with nearby nodes, post status notices, and coordinate logistics.</p>
      </div>

      <form onSubmit={onSubmitPost} className="flex flex-col gap-3 border-b border-warmBeige pb-6">
        <textarea
          value={newPostText}
          onChange={(e) => setNewPostText(e.target.value)}
          placeholder="Share updates, requests, or info with neighbors..."
          className="bg-cream/40 border border-warmBeige rounded-2xl p-4 text-sm text-charcoal outline-none focus:border-clay/40 min-h-[90px] resize-y transition-all"
          required
        />
        <button type="submit" className="px-5 py-2.5 bg-clay text-white font-bold rounded-xl text-xs hover:bg-clay/90 transition-all cursor-pointer w-fit self-end">
          Post Notice
        </button>
      </form>

      <section className="flex flex-col gap-4">
        {posts.map(post => (
          <div key={post.id} className="bg-cream/30 border border-warmBeige rounded-2xl p-5 md:p-6 flex flex-col gap-3 hover:border-clay/20 transition-all duration-300">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-clay/10 border border-clay/20 text-clay font-bold text-xs flex items-center justify-center">
                  {post.avatar}
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-charcoal">{post.author}</h4>
                  <p className="text-[10px] text-stone-400 font-semibold">{post.time}</p>
                </div>
              </div>
              <button 
                onClick={() => onLikePost(post.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-warmBeige bg-white hover:bg-cream/40 rounded-xl text-xs text-stone-500 font-bold transition-all cursor-pointer"
              >
                <HeartIcon className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>{post.likes}</span>
              </button>
            </div>
            <p className="text-xs md:text-sm text-stone-600 leading-relaxed font-medium">
              {post.content}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
