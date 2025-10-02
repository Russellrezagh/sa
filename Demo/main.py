import sys
import os
import torch

# Add the parent directory to the Python path to allow imports from the 'code' directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from code.main import main, config


def demo_config():
    """
    Get the configuration for the demo.
    This function first gets the default configuration from the main script,
    and then overrides the necessary parameters for the demo.
    """
    # Get the default arguments from the main script's config function.
    # Note: config() from code.main already parses command-line arguments.
    # We are overriding the paths and parameters here for the demo.
    args = config()

    # Override the arguments for the demo
    args.dataset_name = "hHEP1000"
    args.expression_path = "./Demo/hHEP/TFs+1000/BL--ExpressionData.csv"
    args.label_path = "./Demo/hHEP/TFs+1000/hHEP1000shuffled_output.txt"
    args.divide_path = "./Demo/hHEP/TFs+1000/hHEP1000_divide.txt"
    args.gene_emb_dir = "./Demo/embeddingspool/"
    args.results_dir = './Demo/results/'
    args.TF_num = 12
    args.gene_list_path = "./Demo/hHEP/TFs+1000/hHEP1000_MAP_NAME.txt"

    # The device is handled by the main config function, which allows for
    # command-line overrides (e.g., `python Demo/main.py --device -1`).
    # If a specific device is needed for the demo, it can be hardcoded here.

    return args


if __name__ == '__main__':
    # Ensure the script is run from the root directory for correct path resolution
    if not os.path.exists('code') or not os.path.exists('Demo'):
        print("Please run this script from the root directory of the project.")
        sys.exit(1)

    args = demo_config()
    print("Running demo with the following arguments:")
    print(args)
    main(args)