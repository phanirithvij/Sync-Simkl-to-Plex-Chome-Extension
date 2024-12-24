// TODO pnpm JSZip, FileSaver
// TODO remove fileSaver, replace with a simple <a> href download thing

const zipSimklLibrary = async () => {
  // create a zip file with all the simkl library entries
  if (typeof JSZip === "undefined") return;
  let webm = await (
    await fetch(chrome.runtime.getURL("assets/sample.webm"))
  ).blob();
  consolelog(webm)();
  let zip = new JSZip();
  let moviesZ = zip.folder("Simkl Movies");
  moviesZ.file("{tmdb-634649}.webm", webm, { binary: true });
  let showsZ = zip.folder("Simkl TV Shows");
  let showDir = showsZ.folder("{tvdb-323168}");
  for (let eno = 0; eno < 10000; eno += 1) {
    if (eno % 1000 == 0) consoledebug("Added", eno, "files")();
    showDir.file(`s01e${eno}.webm`, webm, { binary: true });
  }
  return zip;
};

const saveZipFile = async (zip, type = "blob") => {
  const logLabel = `save_zip_${type}`;
  console.time(logLabel);
  let donee = false;
  let blobdata = await zip.generateAsync(
    {
      type: type,
      compression: "DEFLATE",
      compressionOptions: {
        level: 9,
      },
    },
    // update callback
    (metadata) => {
      if (donee) return;
      donee = true;
      console.timeLog(
        logLabel,
        metadata.percent,
        // "progress: " + metadata.percent.toFixed(2) + " %"
      );
      if (metadata.currentFile) {
        console.timeLog(logLabel, "current file = " + metadata.currentFile);
      }
    },
  );
  // let endTime = performance.now();
  // consoledebug(`${endTime} ended ${type} zipping`)();
  // consoledebug(`${type} took ${endTime - startTime} millisecs`)();
  console.timeEnd(logLabel);
  return blobdata;
};
