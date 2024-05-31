export class NuxtMikroOrmModuleError extends Error {
  #instanceName: string;
  get instanceName() {
    return this.#instanceName;
  }

  constructor(message: string, instanceName: string) {
    super(message);
    this.#instanceName = instanceName;
  }
}

export class NuxtMikroOrmNotInitialized extends NuxtMikroOrmModuleError {
}

export class NuxtMikroOrmAlreadyInitialized extends NuxtMikroOrmModuleError {}

export class NuxtMikroOrmForkUnavailable extends NuxtMikroOrmModuleError {}
