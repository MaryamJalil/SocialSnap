const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('@ffprobe-installer/ffprobe');
const fs = require('fs')

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobe.path);
// console.log(ffmpegInstaller.path, ffmpegInstaller.version);

const getRandomIntegerInRange = (min, max) => {
    const minInt = Math.ceil(min);
    const maxInt = Math.floor(max);

    return Math.floor(Math.random() * (maxInt - minInt + 1) + minInt);
};

const getStartTimeInSeconds = (
    videoDurationInSeconds,
    fragmentDurationInSeconds,
) => {
    // by subtracting the fragment duration we can be sure that the resulting
    // start time + fragment duration will be less than the video duration
    const safeVideoDurationInSeconds =
        videoDurationInSeconds - fragmentDurationInSeconds;

    // if the fragment duration is longer than the video duration
    if (safeVideoDurationInSeconds <= 0) {
        return 0;
    }

    return getRandomIntegerInRange(
        0.25 * safeVideoDurationInSeconds,
        0.75 * safeVideoDurationInSeconds,
    );
};

const getVideoInfo = (inputPath) => {
    return new Promise((resolve, reject) => {
        return ffmpeg.ffprobe(inputPath, (error, videoInfo) => {
            if (error) {
                return reject(error);
            }

            const { duration, size } = videoInfo.format;

            return resolve({
                size,
                durationInSeconds: Math.floor(duration),
            });
        });
    });
};


const createFragmentPreview = async (
    inputPath,
    outputPath,
    fragmentDurationInSeconds = 3,
) => {
    return new Promise(async (resolve, reject) => {
        const { durationInSeconds: videoDurationInSeconds } = await getVideoInfo(
            inputPath,
        );

        return ffmpeg(inputPath)
            .outputOptions([
                '-f',
                'gif',
                '-pix_fmt',
                'rgb24',
                '-r',
                '5',
                '-filter:v',
                'scale=200:-1,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
                '-t',
                fragmentDurationInSeconds,
            ])
            .output(outputPath)
            .on('end', function () {
                resolve(outputPath)
            })
            .run();
    });
};
const captureThumbnail = (inputPath, fileName) => {
    console.log("🚀 ~ file: ffmpeg.js:86 ~ captureThumbnail ~ fileName", fileName)
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .on('end', async function () {
                resolve(`./src/files/thumbnail/${fileName}`)
            })
            .screenshots({
                count: 1,
                folder: './src/files/thumbnail/',
                size: '290x420',
                filename: fileName
            })
    })

}


module.exports = { createFragmentPreview, captureThumbnail }