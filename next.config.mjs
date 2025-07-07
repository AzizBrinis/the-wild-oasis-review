/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      new URL(
        "https://dhckdzckgxbzdaaudhrz.supabase.co/storage/v1/object/public/cabins-images/**"
      ),
    ],
  },
};

export default nextConfig;
