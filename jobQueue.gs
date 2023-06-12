//This is the number of ms to wait before running the job queue. 
const TRIGGER_DELAY = 30000;
//This is the number of ms to wait before retrying a create trigger action. 
const TRIGGER_CREATE_RETRY_TIME = 5000;
//The array to convert statuses to text. 
const JOB_STATUS = ['Waiting', 'Completed', 'Failed'];
//The number of MS to keep a completed job in the queue. 10 minutes. 
const JOB_EXPIRE_MS = 600000;
/*
Job Queue format
{
  jobId: UUID
  srcId: string,
  srcTitle: string,
  destId: string,
  sharedDiveId: string,
  destDir: string,
  submitted: dateTime,
  expire: dateTime,
  status: int,
  error: string

}
*/
//----------------------------------------------------------------
function jobQueueClear() {
  PropertiesService.getUserProperties().deleteProperty("jobQueue");
}
//----------------------------------------------------------------
function jobQueueNewJob(title, id) {
  return {
    jobId: Utilities.getUuid(),
    srcId: id,
    srcTitle: title,
    destId: null,
    sharedDriveId: null,
    destDir: null,
    submitted: null,
    expire: null,
    status: 0,
    error: null
  }

}
//----------------------------------------------------------------
//Useful for debugging. 
function jobQueueLog() {
  Logger.log(PropertiesService.getUserProperties().getProperty("jobQueue"));
}
//----------------------------------------------------------------
function jobQueueDeleteJob(deleteJobId) {
  let newJobQueue = [];
  let jobQueue = jobQueueGet();
  for (let job of jobQueue) {
    if (job.jobId != deleteJobId) {
      newJobQueue.push(job);
    }
  }
  jobQueueSet(newJobQueue);
}
//----------------------------------------------------------------
function jobQueueGet() {

  let rv = [];
  let allJobs = JSON.parse(PropertiesService.getUserProperties().getProperty("jobQueue"));
  if (allJobs) {
    for (let job of allJobs) {
      //If the job is complete (either error or not) AND it has expired, don't return it as part of the active queue. 
      if (job.status != 0 && job.expire < Date.now()) {
        continue;
      }
      rv.push(job);
    }
  }
  //We immediately set the job queue since getting the queue removes any expired jobs. 
  jobQueueSet(rv);
  return rv;
}
//----------------------------------------------------------------
function jobQueueSet(jobQueue) {
  try {
    PropertiesService.getUserProperties().setProperty("jobQueue", JSON.stringify(jobQueue));
  }
  catch (e) {
    Logger.log("Failed saving job queue " + e);
  }
}
//----------------------------------------------------------------
function jobQueueRun() {
  let jobQueue = jobQueueGet();
  for (let i = 0; i < jobQueue.length; i++) {
    if (jobQueue[i].status) {
      continue;
    }
    jobQueue[i] = driveConvertFile(jobQueue[i]);
    jobQueueSet(jobQueue);
  }
}
//----------------------------------------------------------------
function jobQueueSetTrigger() {
  //We need to make sure that multiple triggers don't run at once. 
  let newTrigger;
  let jobQueue = jobQueueGet();
  for (let job of jobQueue) {
    if (!job.status) {
      Logger.log("There are incomplete jobs. Clearing old triggers, and creating new one");
      let projectTriggers = ScriptApp.getProjectTriggers();
      for (let i = 0; i < projectTriggers.length; i++) {
        if (projectTriggers[i].getHandlerFunction() == "jobQueueRun") {
          ScriptApp.deleteTrigger(projectTriggers[i]);
          Utilities.sleep(1000);
        }
      }
      //I'm doing this in a do - while loop so we make 100% sure we create a new trigger. 
      //If it fails for some reason it'll loop until it works. 
      do {
        Logger.log("Creating trigger to run in " + TRIGGER_DELAY + " ms");
        try {
          newTrigger = ScriptApp.newTrigger("jobQueueRun")
            .timeBased()
            .after(TRIGGER_DELAY)
            .create();
        }
        catch (e) {
          Logger.log("Failed to create a new trigger. Trying again.");
          Utilities.sleep(TRIGGER_CREATE_RETRY_TIME);
        }
      } while (!newTrigger)
      break;
    }
  }
}
