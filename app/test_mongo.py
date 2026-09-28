from pymongo import MongoClient

URI = "mongodb+srv://kinzay08:LciZvj0Zkuh0gqKc@cluster0.eqsk2hk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

# Sanity check what we're actually sending
import re
print("Using URI:", re.sub(r"(://[^:]+:)([^@]+)(@)", r"\1****\3", URI))

client = MongoClient(URI, serverSelectionTimeoutMS=8000)
print("Ping:", client.admin.command("ping"))