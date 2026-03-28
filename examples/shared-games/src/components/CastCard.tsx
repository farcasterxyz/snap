"use client";

import Avatar from "./Avatar";

interface CastCardProps {
  username: string;
  time: string;
  text: string;
  channel?: string;
  image?: string;
  likes?: number;
  comments?: number;
  verified?: boolean;
}

export default function CastCard({
  username,
  time,
  text,
  channel,
  image,
  likes = 0,
  comments = 0,
  verified = false,
}: CastCardProps) {
  return (
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="flex gap-3">
        <Avatar name={username} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[15px] text-gray-900 truncate">
              {username}
            </span>
            {verified && (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="#8B5CF6">
                <path d="M8 0L10.2 2.4L13.4 2.1L13.7 5.3L16 7.5L13.7 9.7L13.4 12.9L10.2 12.6L8 15L5.8 12.6L2.6 12.9L2.3 9.7L0 7.5L2.3 5.3L2.6 2.1L5.8 2.4L8 0Z" />
                <path d="M6.5 10.5L4 8L5 7L6.5 8.5L11 4L12 5L6.5 10.5Z" fill="white" />
              </svg>
            )}
            {channel && (
              <span className="text-[13px] text-gray-400">
                in <span className="text-[var(--fc-purple)]">{channel}</span>
              </span>
            )}
            <span className="text-[13px] text-gray-400 ml-auto shrink-0">{time}</span>
          </div>
          <p className="text-[15px] text-gray-800 mt-1 leading-relaxed whitespace-pre-wrap">
            {text}
          </p>
          {image && (
            <div className="mt-3 rounded-xl overflow-hidden bg-gray-100">
              <img src={image} alt="" className="w-full object-cover" />
            </div>
          )}
          <div className="flex items-center gap-6 mt-3 text-gray-400">
            <button className="flex items-center gap-1.5 text-[13px] hover:text-gray-600">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
              </svg>
              {comments > 0 && comments}
            </button>
            <button className="flex items-center gap-1.5 text-[13px] hover:text-gray-600">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
              </svg>
            </button>
            <button className="flex items-center gap-1.5 text-[13px] hover:text-[#EF4444]">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {likes > 0 && likes}
            </button>
            <button className="flex items-center gap-1.5 text-[13px] hover:text-gray-600 ml-auto">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
