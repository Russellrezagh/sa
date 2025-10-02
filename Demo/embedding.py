import sys
import os
import logging
import numpy as np

# Add the parent directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from code.embedding import train, config, set_seed


def demo_config():
    """
    Get the configuration for the demo.
    This function first gets the default configuration from the main script,
    and then overrides the necessary parameters for the demo.
    """
    args = config()

    # Override the default arguments for the demo
    args.data_name = "hHEP1000"
    args.data_path = "./Demo/hHEP/TFs+1000/BL--ExpressionData.csv"
    args.emb_dir = './Demo/embeddings/'
    args.is_save = True

    return args


if __name__ == '__main__':
    # Ensure the script is run from the root directory for correct path resolution
    if not os.path.exists('code') or not os.path.exists('Demo'):
        print("Please run this script from the root directory of the project.")
        sys.exit(1)

    args = demo_config()
    set_seed(args.seed)

    # Define and create the embedding path
    path = os.path.join(args.emb_dir, args.data_name)
    args.emb_path = path
    if not os.path.exists(path):
        os.makedirs(path)

    # Configure logging
    logging.basicConfig(filename=os.path.join(path, "HGATLink_train.log"), level=logging.INFO)
    args_dict = args.__dict__
    for k, v in args_dict.items():
        logging.info("{}: {}".format(k, v))

    print("Running demo with the following arguments:")
    print(args)
    train(args)