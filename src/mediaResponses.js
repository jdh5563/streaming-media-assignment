const fs = require('fs');
const path = require('path');

// Writes an error to the response
const writeError = (err, response) => {
  if (err.code === 'ENOENT') {
    response.writeHead(404);
  }
  return response.end(err);
};

// Returns a stream containing the given file
const createMediaStream = (response, file, start, end) => {
  const stream = fs.createReadStream(file, { start, end });

  stream.on('open', () => {
    stream.pipe(response);
  });

  stream.on('error', (streamErr) => {
    response.end(streamErr);
  });

  return stream;
};

// Writes a response with the 206 (Partial File) code
// Then sends the obtained file information to a media stream
const writePartialFileResponse = (stats, request, response, file, fileFormat) => {
  let { range } = request.headers;

  if (!range) {
    range = 'bytes=0-';
  }

  const positions = range.replace(/bytes=/, '').split('-');

  let start = parseInt(positions[0], 10);

  const total = stats.size;
  const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

  if (start > end) {
    start = end - 1;
  }

  const chunkSize = (end - start) + 1;

  response.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${total}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkSize,
    'Content-Type': fileFormat,
  });

  createMediaStream(response, file, start, end);
};

// Loads the given file
const loadFile = (request, response, filePath, fileFormat) => {
  const file = path.resolve(__dirname, filePath);

  fs.stat(file, (err, stats) => {
    if (err) return writeError(err, response);
    return writePartialFileResponse(stats, request, response, file, fileFormat);
  });
};

// Getters to send the correct media file
const getParty = (request, response) => {
  loadFile(request, response, '../client/party.mp4', 'video/mp4');
};

const getBling = (request, response) => {
  loadFile(request, response, '../client/bling.mp3', 'audio/mpeg');
};

const getBird = (request, response) => {
  loadFile(request, response, '../client/bird.mp4', 'video/mp4');
};

module.exports = {
  getParty,
  getBling,
  getBird,
};
