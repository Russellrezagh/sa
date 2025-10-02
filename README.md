# HGATLink: Single-Cell Gene Regulatory Network Inference

This project implements HGATLink, a model for inferring single-cell gene regulatory networks by fusing heterogeneous graph attention networks and a Transformer-based architecture.

## Project Structure

The project is organized into two main directories:

-   `code/`: Contains the core source code for the HGATLink model, including data processing, embedding generation, and link prediction.
-   `Demo/`: Provides scripts and data for a demonstration of the model's functionality. The demo scripts are wrappers that execute the core code with pre-configured paths for the demo datasets.

## How to Use

### Step 1: Install Dependencies

First, install the required Python packages:

```bash
pip install -r requirements.txt
```

### Step 2: Generate Gene Embeddings

To generate the gene embeddings, run the `embedding.py` script. This will train the model and save the embeddings to the `./embeddings/` directory.

```bash
python code/embedding.py
```

You can customize the script's behavior with command-line arguments. For example, to use a different dataset or change the training parameters, you can pass arguments like `--data_name`, `--data_path`, and `--train_lr`. For a full list of options, run:

```bash
python code/embedding.py --help
```

### Step 3: Perform Link Prediction

Once the embeddings have been generated, you can perform link prediction using the `main.py` script. This will use the learned embeddings to predict gene regulatory links and save the results to the `./results/` directory.

```bash
python code/main.py
```

Similar to the embedding script, you can customize the link prediction process with command-line arguments, such as `--dataset_name`, `--expression_path`, and `--gene_emb_dir`. For a full list of options, run:

```bash
python code/main.py --help
```

## Demo

The `Demo` directory contains scripts to run a demonstration of the pipeline with a sample dataset.

### 1. Link Prediction with Pre-trained Embeddings

To run the link prediction demo with the provided pre-trained embeddings, execute the following command:

```bash
python Demo/main.py
```

This will run the link prediction pipeline using the embeddings in `Demo/embeddingspool/` and save the results in the `Demo/results/` directory.

### 2. Re-learn Embeddings for the Demo

If you want to re-learn the gene embeddings for the demo dataset, run:

```bash
python Demo/embedding.py
```

This will generate new embeddings and save them in the `Demo/embeddings/` directory. You can then run the link prediction demo, which will automatically use these newly generated embeddings if the `gene_emb_dir` argument is updated accordingly.

## Acknowledgement

We are deeply grateful for the valuable code and efforts contributed by the following GitHub repositories. This contribution has been immensely beneficial to our work.

-   [GMFGRN](https://github.com/Lishuoyy/GMFGRN)
-   [GENELink](https://github.com/zpliulab/GENELink)

*This codebase has been refactored to improve modularity, remove redundancy, and enhance maintainability.*