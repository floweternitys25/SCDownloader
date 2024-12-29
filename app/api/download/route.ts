import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const deleteFileOrDirAfterDelay = async (filePath: string, delay: number) => {
  await new Promise((resolve) => setTimeout(resolve, delay));
  try {
    const stat = await fs.lstat(filePath);
    if (stat.isDirectory()) {
      await fs.rm(filePath, { recursive: true, force: true });
    } else {
      await fs.unlink(filePath);
    }
    console.log(`Deleted: ${filePath}`);
  } catch (error) {
    console.error(`Failed to delete ${filePath}:`, error);
  }
};

export async function POST(req: Request) {
  try {
    const { urlM3u8 } = await req.json();
    if (!urlM3u8) {
      return NextResponse.json(
        { error: 'M3U8 URL is required' },
        { status: 400 }
      );
    }
    const uniqueId = uuidv4();
    const tempDir = path.resolve('temp', uniqueId);
    await fs.mkdir(tempDir, { recursive: true });
    // Downloading .m3u8 temporary file
    const m3uResponse = await axios.get(urlM3u8);
    const m3uContent = m3uResponse.data;
    const m3uPath = path.join(tempDir, `${uniqueId}.m3u8`);
    await fs.writeFile(m3uPath, m3uContent);
    // Extracting segment urls
    const segmentUrls: string[] = m3uContent
      .split('\n')
      .filter((line: string) => line && !line.startsWith('#'));
    if (segmentUrls.length === 0) {
      return NextResponse.json(
        { error: 'No valid segments found in playlist' },
        { status: 400 }
      );
    }
    const segmentFiles: string[] = [];
    // Downloading segments
    for (const [index, segmentUrl] of segmentUrls.entries()) {
      const segmentResponse = await axios.get(segmentUrl, { responseType: 'arraybuffer' });
      const segmentPath = path.join(tempDir, `segment_${index}_${uniqueId}.mp3`);
      await fs.writeFile(segmentPath, segmentResponse.data);
      segmentFiles.push(segmentPath);
    }
    // Combining segments into MP3 file
    const outputPath = path.resolve('public', 'downloads', `${uniqueId}.mp3`);
    const writeStream = await fs.open(outputPath, 'w');
    for (const segmentFile of segmentFiles) {
      const data = await fs.readFile(segmentFile);
      await writeStream.write(data);
    }
    await writeStream.close();
    deleteFileOrDirAfterDelay(tempDir, 120000); 
    deleteFileOrDirAfterDelay(outputPath, 300000);
    return NextResponse.json(
      { downloadUrl: `/downloads/${uniqueId}.mp3` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process the request' },
      { status: 500 }
    );
  }
}
