/**
 * Base class for all errors thrown by this module.
 */
export class NuxtMikroOrmModuleError extends Error {
  /**
   * The name of the instance to which the error refers to.
   * @private
   */
  #instanceName: string;

  /**
   * The name of the instance to which the error refers to.
   */
  get instanceName() {
    return this.#instanceName;
  }

  constructor(message: string, instanceName: string) {
    super(message);
    this.#instanceName = instanceName;
  }
}

/**
 * Thrown when trying to access a MikroORM that is not initialized.
 */
export class NuxtMikroOrmNotInitialized extends NuxtMikroOrmModuleError {
}

/**
 * Thrown when attempting to initialize a MikroORM instance that is already initialized.
 */
export class NuxtMikroOrmAlreadyInitialized extends NuxtMikroOrmModuleError {}

/**
 * Thrown when trying to access the EntityManager from an island component,
 * while the request's event handler did not fork the entity manager previously.
 */
export class NuxtMikroOrmForkUnavailable extends NuxtMikroOrmModuleError {}
