var ffmpeg = require('fluent-ffmpeg');

exports.createVideoFrame = (videoPath) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    ffmpeg({source:videoPath}).takeScreenshots({
      filename:uniqueSuffix + ".png",
      timemarks:[2]
    },'Uploads')

    return uniqueSuffix + ".png";

  };

  exports.getVideoDuration = (videoPath) => {
        return new Promise((resolve, reject) => {
          ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) {
              reject(err);
            } else {
              const durationInSeconds = metadata.format.duration;
              resolve(durationInSeconds);
            }
          });
        });
      }
      