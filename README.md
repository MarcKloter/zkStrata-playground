# zkStrata-playground
The zkStrata playground is a showcase of the [zkStrata language](https://github.com/MarcKloter/zkStrata), a declarative language for zero-knowledge proof specification over structured data.

The playground can be launched using [Docker](https://www.docker.com/).

## Getting started
1. Compiling the multi-stage build:
   ```
   docker image build -f playground.dockerfile -t playground .
   ```

2. Running the container:
   ```
   docker container run --publish 8000:3000 --detach --name pg playground
   ```

3. The playground will be available at http://localhost:8000/.
