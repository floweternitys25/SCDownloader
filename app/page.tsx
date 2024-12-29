"use client";

import { useState } from "react";

const Home = () => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const handleDownload = async () => {
    setLoading(true);
    try {
      const responseGET = await fetch(`/api/getData?url=${text}`);
      if (responseGET.ok) {
        const data = await responseGET.json();
        const urlM3u8 = data.urlM3u8;
        const responsePOST = await fetch("/api/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urlM3u8 }),
        });
        const { downloadUrl } = await responsePOST.json();
        if (responsePOST.ok && downloadUrl) {
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = data.title + ".mp3";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          const countResponse = await fetch("/api/downloadCount");
          if (countResponse.ok) {
            const { downloadCount } = await countResponse.json();
            console.log(`Download Successful! Total downloads: ${downloadCount}`);
          }        } else {
          alert("An unexpected error occurred.");
        }
      } else {
        alert("An unexpected error occurred.");
      }
    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>SoundCloud Downloader</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste link here"
      />
      <button onClick={handleDownload} disabled={loading}>
        {loading ? "Processing..." : "Download MP3"}
      </button>
    </div>
  );
  
};

export default Home;