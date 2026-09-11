import sys
import sklearn
import joblib
import os

print("--- VERIFYING ANOMALY MODEL (FRESH PROCESS) ---")
print(f"Python version: {sys.version.split()[0]}")
print(f"Scikit-Learn version: {sklearn.__version__}")
print(f"Joblib version: {joblib.__version__}")

model_path = 'models/ais_anomaly.pkl'
if not os.path.exists(model_path):
    print(f"Error: {model_path} does not exist.")
    sys.exit(1)
    
try:
    model = joblib.load(model_path)
    print("Model loaded successfully.")
    print(f"Model type: {type(model)}")
    print(f"Model parameters: {model.get_params()}")
    print("Serialization is valid and functional.")
except Exception as e:
    print(f"Deserialization failed: {str(e)}")
    sys.exit(1)
print("--- VERIFICATION COMPLETE ---")
