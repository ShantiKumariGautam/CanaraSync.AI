
import '@tensorflow/tfjs-react-native'; 


import { asyncStorageIO } from '@tensorflow/tfjs-react-native';

; 
; 

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { GestureLog } from './logGesture'; 


export const NUM_TRAINING_SESSIONS = 6; 


const FEATURES_TO_ENCODE = [
  'x',
  'y',
  'touchDuration',
  'timeSinceLastGesture',
  'dx',
  'dy',
  'vx',
  'vy',
  'scrollSpeed',
  'scrollDistance',
  'typingSpeed',
];


const MODEL_PATH_PREFIX = 'asyncstorage://autoencoderModel_';

function createAutoencoder(inputDim: number): tf.LayersModel {
  const encodingDim = Math.floor(inputDim / 2); 
  console.log(
    `Creating autoencoder with input dimension: ${inputDim}, encoding dimension: ${encodingDim}`
  );

  const encoder = tf.sequential({
    layers: [
      tf.layers.dense({
        inputDim: inputDim,
        units: encodingDim,
        activation: 'relu',
        name: 'encoder_input',
      }),
      tf.layers.dense({
        units: encodingDim,
        activation: 'relu',
        name: 'encoder_hidden',
      }),
    ],
  });

  const decoder = tf.sequential({
    layers: [
      tf.layers.dense({
        inputDim: encodingDim,
        units: encodingDim,
        activation: 'relu',
        name: 'decoder_hidden',
      }),
      tf.layers.dense({
        units: inputDim,
        activation: 'sigmoid',
        name: 'decoder_output',
      }),
    ],
  });

  const autoencoder = tf.model({
    inputs: encoder.inputs,
    outputs: decoder.apply(encoder.outputs[0]) as tf.SymbolicTensor,
  });

  autoencoder.compile({
    optimizer: tf.train.adam(),
    loss: 'meanSquaredError',
  });

  console.log('Autoencoder model created and compiled.');
  autoencoder.summary();
  return autoencoder;
}


function preprocessData(gestures: GestureLog[]): tf.Tensor2D {
  if (gestures.length === 0) {
    throw new Error('No gestures provided for preprocessing.');
  }

  const processedData = gestures.map((gesture) => {
    return FEATURES_TO_ENCODE.map((feature) => {
      let value = (gesture as any)[feature]; 

     
      if (value === undefined || value === null) {
        value = 0;
      }

      
      if (typeof value === 'boolean') {
        value = value ? 1 : 0;
      }

      return value;
    });
  });

  
  const tensor = tf.tensor2d(processedData) as tf.Tensor2D; 
  const min = tensor.min(0);
  const max = tensor.max(0);
  
  const normalizedTensor = tensor
    .sub(min)
    .div(max.sub(min).add(tf.scalar(1e-7))) as tf.Tensor2D; 
  console.log(
    'Data preprocessed and normalized. Shape:',
    normalizedTensor.shape
  );
  return normalizedTensor;
}


export async function trainAutoencoder(
  gestures: GestureLog[],
  userEmail: string
): Promise<boolean> {
  console.log(`[trainAutoencoder] Starting training for user: ${userEmail}`);
  if (gestures.length < 300) {
    console.warn(
      `[trainAutoencoder] Not enough gestures for meaningful training: ${gestures.length}. Minimum 100 recommended.`
    );
    return false;
  }

  try {
    const trainingData = preprocessData(gestures);
    const inputDim = trainingData.shape[1];

    const model = createAutoencoder(inputDim);

    console.log(
      `[trainAutoencoder] Training autoencoder with ${trainingData.shape[0]} samples and ${inputDim} features.`
    );

    await model.fit(trainingData, trainingData, {
      epochs: 40, 
      batchSize: 32,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(
            `[trainAutoencoder] Epoch ${epoch + 1}: loss = ${logs?.loss}`
          );
        },
      },
    });

    
    const sanitizedEmail = encodeURIComponent(userEmail);
    
    const modelPath = `${MODEL_PATH_PREFIX}${sanitizedEmail}`;

    console.log(`[trainAutoencoder] Attempting to save model to ${modelPath}`);
    try {
      await model.save(modelPath);
      console.log(
        `[trainAutoencoder] Model trained and saved successfully to ${modelPath}`
      );
    } catch (saveError: any) {
      console.error(
        `[trainAutoencoder] ERROR saving model to ${modelPath}:`,
        saveError
      );
      return false;
    }

   
    const trainedFlagKey = `userBehavioralProfile_${userEmail}`;
    console.log(
      `[trainAutoencoder] Attempting to set trained flag '${trainedFlagKey}' to 'trained'`
    );
    try {
      await AsyncStorage.setItem(trainedFlagKey, 'trained');
      const verifyStatus = await AsyncStorage.getItem(trainedFlagKey);
      console.log(
        `[trainAutoencoder] Verified trained flag '${trainedFlagKey}' immediately after setting: '${verifyStatus}'`
      );
    } catch (flagError: any) {
      console.error(
        `[trainAutoencoder] ERROR setting trained flag '${trainedFlagKey}':`,
        flagError
      );
      return false; 
    }

    
    trainingData.dispose();

    return true;
  } catch (error: any) {
   
    console.error(
      '[trainAutoencoder] Error during autoencoder training (overall catch):',
      error
    );
    return false;
  }
}


export async function initializeAutoencoderModel(
  userEmail: string
): Promise<tf.LayersModel | null> {
  const modelPath = `${MODEL_PATH_PREFIX}${userEmail}`;
  console.log(
    `[initializeAutoencoderModel] Attempting to load model from: ${modelPath} for user: ${userEmail}`
  );
  try {
    const model = await tf.loadLayersModel(modelPath);
    console.log(
      `[initializeAutoencoderModel] Model loaded successfully from ${modelPath}`
    );
    return model;
  } catch (error: any) {
   
    console.warn(
      `[initializeAutoencoderModel] No saved model found for ${userEmail} at ${modelPath}. A new model will be created if training is initiated. Error: ${error.message}`
    );
   
    return null;
  }
}


export async function isBehavioralProfileTrained(
  userEmail: string
): Promise<boolean> {
  const trainedFlagKey = `userBehavioralProfile_${userEmail}`;
  console.log(
    `[isBehavioralProfileTrained] Checking trained status for user: ${userEmail}, key: ${trainedFlagKey}`
  );
  try {
    const status = await AsyncStorage.getItem(trainedFlagKey);
    console.log(
      `[isBehavioralProfileTrained] Retrieved status for '${trainedFlagKey}': '${status}'`
    );
    return status === 'trained';
  } catch (error: any) {

    console.error(
      `[isBehavioralProfileTrained] Error checking behavioral profile trained status for ${userEmail}:`,
      error
    );
    return false;
  }
}


export async function detectAnomaly(
  model: tf.LayersModel,
  gesture: GestureLog,
  userEmail: string
): Promise<{ isAnomaly: boolean; reconstructionError: number }> {
  let processedGesture: tf.Tensor2D | null = null;
  let reconstruction: tf.Tensor2D | null = null;

  try {
    if (!model) {
      console.warn(`Cannot detect anomaly: Model is null for ${userEmail}.`);
      return { isAnomaly: false, reconstructionError: -1 };
    }

    processedGesture = preprocessData([gesture]);

   
    reconstruction = model.predict(processedGesture) as tf.Tensor2D;

   
    const error = tf.metrics
      .meanSquaredError(processedGesture, reconstruction)
      .dataSync()[0];

    
    const ANOMALY_THRESHOLD = 0.05; 

    return {
      isAnomaly: error > ANOMALY_THRESHOLD,
      reconstructionError: error,
    };
  } catch (error: any) {
   
    console.error('Error during anomaly detection:', error);
    return { isAnomaly: false, reconstructionError: -1 };
  } finally {
    
    if (processedGesture) {
      processedGesture.dispose();
    }
    if (reconstruction) {
      reconstruction.dispose();
    }
    
  }
}
