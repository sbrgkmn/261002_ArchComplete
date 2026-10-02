# ArchComplete: Autoregressive 3D Architectural Design Generation with Hierarchical Diffusion-Based Upsampling [Computers & Graphics 2025]

![teaser](./assets/ArchComplete_TEASER.png)
[[Main Manuscript (Computers & Graphics)](https://doi.org/10.1016/j.cag.2025.104477)]
[[Main Manuscript (arXiv)](https://doi.org/10.48550/arXiv.2412.17957)]
[[Supplementary Material](https://ars.els-cdn.com/content/image/1-s2.0-S0097849325003188-mmc1.pdf)]

[Shervin Rasoulzadeh](https://scholar.google.com/citations?user=Dkl2LuwAAAAJ)<sup>1</sup>, [Mathias Bank Stigsen]()<sup>2</sup>, [Iva Kovacic]()<sup>1</sup>, [Kristina Schinegger]()<sup>2</sup>, [Stefan Rutzinger]()<sup>2</sup>, [Michael Wimmer](https://www.cg.tuwien.ac.at/staff/MichaelWimmer)<sup>1</sup>.

<sup>1</sup> TU Wien, Center for Geometry and Computational Design, Austria  
<sup>2</sup> University of Innsbruck, Department of Design, i.sd | Structure and Design, Austria

This repository contains the official implementation for the paper "ArchComplete: Autoregressive 3D Architectural Design Generation with Hierarchical Diffusion-Based Upsampling", accepted for publication in Computers & Graphics, 2025.

For code-related questions (training, inference, etc.), please contact [Shervin Rasoulzadeh](mailto:srasoulzadeh@cg.tuwien.ac.at), and for dataset inquiries, please contact [Mathias Bank Stigsen](mailto:mathias.bank-stigsen@uibk.ac.at).

## News

- 2025-11-13 Article published online 🚀🚀🚀

- 2025-11-04 Article accepted for publication in Computers & Graphics 🚀🚀

- 2025-11-01 Article presented at SMI 2025: Shape Modeling International 🚀

- Code awarded replicability stamp by the [Graphics Replicability Stamp Initiative (GRSI)](https://www.replicabilitystamp.org/index.html#https-gitlab-cg-tuwien-ac-at-srasoulzadeh-archcomplete) <img src="https://www.replicabilitystamp.org/logo/Reproducibility-small.png" width="20">

## Quick Start

The following shows how to install and reproduce some ArchComplete's example application results showcased in the paper, including the use of Genetic Algorithm (GA) operators for shape interpolation and variation, unconditional synthesis, and hierarchical upsamplings.

### Installation

Clone the repository

```bash
git clone https://gitlab.cg.tuwien.ac.at/srasoulzadeh/archcomplete.git
cd archcomplete
````

Create the `ArchComplete` conda environment and install the dependencies: 

```bash
# Create and activate the Conda environment
conda env create -f environment.yml
conda activate ArchComplete
```

```bash
conda install pytorch==2.2.0 torchvision==0.17.0 torchaudio==2.2.0 pytorch-cuda=12.1 numpy==1.26.4 -c pytorch -c nvidia
```

Add the current directory to Python’s import path.

```bash
export PYTHONPATH="${PWD}"
```

### Inference Commands & Runtimes

We provide pretrained models for all experiments shown in our paper. Download all of them:

```bash
python res/dl_stage_1_pretrained_weights.py
python res/dl_stage_2_pretrained_weights.py
```

⚠️ Notes:

- The pipeline was originally trained and tested on an **NVIDIA A100 (80GB)** GPU, and the runtimes reported below are measured on this setup.  
- All required input models are already included in the repository in the `00_INT_INP/`, `01_VAR_INP/`, `03_UPS/` directories.
- In all experiments, the generated models are saved in both `.vox` and `.obj` formats.  To open the `.vox` format, we recommend using [Goxel](https://goxel.xyz), a 3D voxel editor.

#### **Interpolation (Figure 5 in the paper):**  
  - Command:  
    ```bash
    python src/inference/infer_stage_1.py --run_timestamp 1727740024.176496 --mode INT --method RANDOM_UNIFORM --path_a ./00_INT_INP/gropiushouse.binvox --path_aa ./00_INT_INP/trianglehouse.binvox --num 32
    ```  
  - Runtime: 28.97s
  - Outputs are saved in the `./00_INT_OUT/` directory.

#### **Variation (Figure 6 in the paper):**  
  - Command:  
    ```bash
    python src/inference/infer_stage_1.py --run_timestamp 1727740024.176496 --mode VAR --method SWP --path_a ./01_VAR_INP/glasshouse.binvox --num 32
    ```  
  - Runtime: 22.86s.
  - Outputs are saved in the `./01_VAR_OUT/` directory.

#### **Unconditional Synthesis (Figure 7 in the paper):**  
  - Command:  
    ```bash
    python src/inference/infer_stage_1.py --run_timestamp 1727740024.176496 --mode SYN --num 32
    ```  
  - Runtime: 65.73s
  - Outputs are saved in the `./02_SYN_OUT/` directory.

#### **Hierarchical Upsampling ($64^{3} \to 128^{3}$) (Figure 12 in the paper, top row, middle-left):**  
  - Command
    ```bash
    python src/inference/infer_stage_2.py --run_timestamp 1743429212.9585347 --path_a 03_UPS/EXTRA02_064.vox --inp_resolution 64 --out_resolution 128 --method DDIM
    ```  
    - Runtime: 88.08s.
    - Upsampled output is saved in the `./03_UPS/` directory and named as `EXTRA02_128`.

#### **Hierarchical Upsampling ($128^{3} \to 256^{3}$) (Figure 12 in the paper, top row, middle-right):**  
  - Step 2 ($128^3 \to 256^3$):  
    ```bash
    python src/inference/infer_stage_2.py --run_timestamp 1743238100.394161 --path_a 03_UPS/EXTRA02_128.vox --inp_resolution 128 --out_resolution 256 --method DDIM
    ```  
  - Runtime: 45.92s.
  - Upsampled output is saved in the `./03_UPS/` directory and named as `EXTRA02_256`.

#### **Hierarchical Upsampling (256**3 to 512**3) (Figure 12 in the paper, top row, rightmost):**  
  - Step 3 ($256^3 \to 512^3$):  
    ```bash
    python src/inference/infer_stage_2.py --run_timestamp 1744034850.2425942 --path_a 03_UPS/EXTRA02_256.vox --inp_resolution 256 --out_resolution 512 --method DDIM
    ```  
  - Runtime: 434.22s (w/ batch size 32).
  - Upsampled output is saved in the `./03_UPS/` directory and named as `EXTRA02_512`.

### Inference Comparisons

Due to the stochastic nature of sampling and diffusion, outputs may differ across runs but remain qualitatively consistent with the figures in the paper.

- **Fig. 5 (Interpolation):** Inspect the generated models in the `00_INT_OUT/` directory. The models demonstrate interpolations similar to those shown in Figure 5 in the paper inheriting characteristics of the given two coarse input shapes `gropiushouse` and `trianglehouse` provided in the `00_INT_INP` directory.

- **Fig. 6 (Variation):** Inspect the generated models in the `01_VAR_OUT/` directory. The models demonstrate multiple variations similar to those shown in Figure 6 in the paper that exhibit topological changes while retaining similarities to the original coarse input shape `glasshouse` in the `01_VAR_INP` directory.

- **Fig. 7 (Synthesis):** Browse the outputs in the `./02_SYN_OUT/` directory. The models are diverse, coherent 3D coarse shapes at a resolution of $64^3$, similar to those shown in Figure 7 in the paper.

- **Fig. 12 (Upsampling):** Inspect the files in the `./03_UPS/` directory. Each step increases the resolution of the input shape `EXTRA02_64` by a factor of 2, progressively generating higher-resolution grids up to $512^{3}$, while augmenting fine structural details, refining massing, introducing openings and elements, and thinning walls and floors to achieve more accurate architectural thickness, similar to those shown in Figure 12 (top row) in the paper.

<!-- ### Interpolation

#### Input/Output Notes

- **Input (`--path_a`, `--path_aa`)**: Must be `.vox` or `.binvox` files. 
- **Output**: Generated interpolations are stored in the ***./00_INT_OUT*** directory. 

Run the followig to generate the interpolations (Figure 5 in the paper). The inputs for replicability are pre-provided in the ***./00_INT_INP*** directory.

```bash
python src/inference/infer_stage_1.py --run_timestamp 1727740024.176496 --mode INT --method SWP --path_a ./00_INT_INP/gropiushouse.binvox --path_aa ./00_INT_INP/trianglehouse.binvox --num 32 
```

### Variation

#### Input/Output Notes

- **Input (`--path_a`)**: Must be a `.vox` or `.binvox` file.
- **Output**: Variations are stored in the ***./01_VAR_OUT*** directory.

Run the followig to generate the variations (Figure 6 in the paper). The input for replicability is pre-provided in the ***./01_VAR_INP*** directory.

```bash
python src/inference/infer_stage_1.py --run_timestamp 1727740024.176496 --mode VAR --method SWP --path_a ./01_VAR_INP/glasshouse.binvox --num 32
```

### Unconditional Synthesis

#### Input/Output Notes

- **Output**: Synthesized output models are stored in the ***./02_SYN_OUT*** directory.

### Arguments

- `--num` *(default: 64)*: Number of models to synthesize.
- `--temp` *(default: 0.65)*: Controls the randomness or creativity of the model(s) generated.
- `--topp` *(default: 0.85)*: aka nucleus sampling, controls which subset of tokens (the nucleus) considered. It will consider tokens until it reaches their cumulative probability.
- `--topk` *(default: 40)*: Controls exactly how many tokens considered.

Run the followig to unconditionally synthesize new samples (Figure 7 in the paper)

```bash
python src/inference/infer_stage_1.py --run_timestamp 1727740024.176496 --mode SYN --num 64
```

### Upsamplings (Coarse to Fine)

#### Input/Output Notes

- **Input (`--path_a`)**: Must be a `.vox` or `.binvox` file.

- **Output**: Each step's upsampled output model is stored in the **same directory as the input**.

#### Arguments

- `--method` *(default: DDIM)*: Choose between *DDIM* (faster) and *DDPM* (slower).

Run the following cells to progressively upsample a coarse model to a fine one (Figure 12 in the paper). The input for replicability is pre-provided in the ***./03_UPS*** directory.

#### Step 1: $64^3$ → $128^{3}$

```bash
python src/inference/infer_stage_2.py --run_timestamp 1743429212.9585347 --path_a 03_UPS/EXTRA02_064.vox --inp_resolution 64 --out_resolution 128 --method DDIM
```

#### Step 2: $128^3$ → $256^{3}$

(only after Step 1)

```bash
python src/inference/infer_stage_2.py --run_timestamp 1743238100.394161 --path_a 03_UPS/EXTRA02_128.vox --inp_resolution 128 --out_resolution 256 --method DDIM
```

#### Step 3: $256^3$ → $512^{3}$

(only after Step 2)

```bash
python src/inference/infer_stage_2.py --run_timestamp 1744034850.2425942 --path_a 03_UPS/EXTRA02_256.vox --inp_resolution 256 --out_resolution 512 --method DDIM
``` -->

## Dataset

![teaser](./assets/ArchHouse_TEASER_CROPPED.png)

### Download

We provide dataset samples for training the two stages, already pre-voxelized in the `.binvox` format at resolutions $64^{3}$, $128^{3}$, $256^{3}$, and $512^{3}$, respectively. Run the following to download:

```bash
python ./dat/dl_data.py --format ArchHouseBINVOX
```

<!-- We also provide the original samples in the `.obj` format, Run the following commands to download the original 3D dataset and its augmented samples (approx. 12GB):

```bash
python ./dat/dl_data.py --format ArchHouseOBJ
``` -->

For visualizing the `.binvox` files, we suggest using the [viewvox](https://www.patrickmin.com/viewvox/), the 3D model voxel viewer.

## Training

### Stage 1

- `--vqgan_epochs` *(default: 128)*: Number of training epochs for the 3D Voxel VQGAN.  
- `--trans_epochs` *(default: 128)*: Number of training epochs for the GPT-Style Transformer.  

Other parameters (as described in the paper) can be changed in the ***./src/train/train_stage_1_config.py*** file.

```bash
python src/train/train_stage_1.py --train_vqgan --vqgan_epochs 128
python src/train/train_stage_1.py --train_trans --run_timestamp 1727740024.176496 --trans_epochs 128
```

<!-- Or

```bash
python src/train/train_stage_1.py --train_vqgan --train_trans --trans_epochs 128
``` -->

### Stage 2

#### Arguments

- `--epochs` *(default: 3072)*: Number of training epochs.

Other parameters (as described in the paper) can be changed in the ***./src/train/train_stage_2_config.py*** file.

```bash
python src/train/train_stage_2.py --c_patch_res 8 --f_patch_res 16
```

```bash
python src/train/train_stage_2.py --c_patch_res 16 --f_patch_res 32
```

<!-- Run the following to train the network for upsampling from $256^3$ to $512^3$. 
The minimum hardware requirement for training this step is **two** NVIDIA A100 GPUs. -->

```bash
python src/train/train_stage_2.py --c_patch_res 32 --f_patch_res 64
```

## Acknowledgement

This research was funded in whole or in part by the Austrian Science Fund (FWF) 10.55776/F77. For open access purposes, this repository is released under MIT License (See `LICENSE.txt` for the full text). The authors would like to thank the anonymous reviewers for their valuable feedback and comments. 

## Citation

```bash
@article{rasoulzadeh2024archcomplete,
  title={ArchComplete: Autoregressive 3D Architectural Design Generation with Hierarchical Diffusion-Based Upsampling},
  author={Rasoulzadeh, S and Bank, M and Kovacic, I and Schinegger, K and Rutzinger, S and Wimmer, M},
  journal={arXiv preprint arXiv:2412.17957},
  year={2024}
}
```
