import fs from 'fs';
import path from 'path';

const filePath = path.resolve('downloadCount.txt');

const updateDownloadCount = () => {
  let count = 0;
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    count = parseInt(fileContent, 10) || 0;
  }
  count++;
  fs.writeFileSync(filePath, count.toString(), 'utf-8');
  return count;
};

export async function GET() {
  const count = updateDownloadCount(); 
  return new Response(
    JSON.stringify({ downloadCount: count }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
