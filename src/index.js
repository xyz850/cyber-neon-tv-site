export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/youtube-search") {
      if (request.method !== "GET") {
        return Response.json(
          { error: "Method tidak diizinkan." },
          { status: 405 }
        );
      }

      const query = (url.searchParams.get("q") || "").trim();

      if (query.length < 2 || query.length > 100) {
        return Response.json(
          { error: "Masukkan kata pencarian 2 sampai 100 karakter." },
          { status: 400 }
        );
      }

      if (!env.YOUTUBE_API_KEY) {
        return Response.json(
          { error: "API Key YouTube belum terpasang di Worker." },
          { status: 500 }
        );
      }

      const params = new URLSearchParams({
        part: "snippet",
        type: "video",
        maxResults: "10",
        safeSearch: "moderate",
        q: query,
        key: env.YOUTUBE_API_KEY
      });

      try {
        const response = await fetch(
          "https://www.googleapis.com/youtube/v3/search?" + params
        );

        const data = await response.json();

        if (!response.ok) {
          return Response.json(
            { error: "Pencarian YouTube gagal. Periksa API Key atau kuota API." },
            { status: 502 }
          );
        }

        const videos = (data.items || [])
          .filter(item => item.id && item.id.videoId)
          .map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails?.medium?.url || ""
          }));

        return Response.json(
          { results: videos },
          {
            headers: {
              "Cache-Control": "no-store"
            }
          }
        );
      } catch (error) {
        return Response.json(
          { error: "Tidak dapat terhubung ke YouTube." },
          { status: 502 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
