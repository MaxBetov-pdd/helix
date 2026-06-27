"""Module entrypoint for `python -m helix`."""


from helix.config import ensure_state_dir_bootstrapped

ensure_state_dir_bootstrapped()

from helix.cli import cli


if __name__ == "__main__":
    cli()
